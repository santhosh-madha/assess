import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './Inbox.css';

const Inbox = () => {
    const { user, token } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState(null);
    const [selectedPartnerName, setSelectedPartnerName] = useState('');
    const [selectedPropertyContext, setSelectedPropertyContext] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const socket = useRef(null);
    const messagesEndRef = useRef(null);

    const markAsRead = async (partnerId) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/chat/read/${partnerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(prev => prev.map(c => 
                c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
            ));
            if (socket.current) {
                socket.current.emit('markRead', { userId: user.userId });
            }
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    // Initialize Socket
    useEffect(() => {
        if (user && token) {
            socket.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
            socket.current.emit('join', user.userId);

            socket.current.on('message', (incoming) => {
                setMessages(prev => {
                    const isFromPartner = incoming.sender === selectedPartnerId || incoming.receiver === selectedPartnerId;
                    if (isFromPartner) {
                        return [...prev, incoming];
                    }
                    return prev;
                });
                fetchConversations();
            });

            return () => socket.current.disconnect();
        }
    }, [user, token, selectedPartnerId]);

    useEffect(() => {
        if (token) {
            fetchConversations();
            
            // Handle cross-dashboard navigation via URL query
            const params = new URLSearchParams(location.search);
            const targetUser = params.get('user');
            const propertyHint = params.get('property'); // e.g. "Sunny Beach Villa"

            if (targetUser) {
                setSelectedPartnerId(targetUser);
                if (propertyHint) {
                    setSelectedPropertyContext(decodeURIComponent(propertyHint));
                }
                // Resolve partner name from API if no prior conversation
                resolvePartnerInfo(targetUser, propertyHint);
            }
        }
    }, [token, location]);

    useEffect(() => {
        if (selectedPartnerId) {
            fetchMessages(selectedPartnerId);
        }
    }, [selectedPartnerId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const resolvePartnerInfo = async (targetUserId, propertyHint) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/chat/partner-info/${targetUserId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedPartnerName(res.data.partnerName || 'User');
            if (!propertyHint && res.data.propertyContext) {
                setSelectedPropertyContext(res.data.propertyContext);
            }
        } catch (error) {
            console.error("Failed to resolve partner info", error);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
            
            // If we have a selectedPartnerId from URL, try to set their name from the list
            const params = new URLSearchParams(location.search);
            const targetUser = params.get('user');
            if (targetUser) {
                const found = res.data.find(c => c.partnerId.toString() === targetUser);
                if (found) {
                    setSelectedPartnerName(found.partnerName);
                    if (!selectedPropertyContext && found.propertyContext) {
                        setSelectedPropertyContext(found.propertyContext);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const fetchMessages = async (partnerId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/history/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPartnerId) return;

        const chatData = {
            senderId: user.userId,
            receiverId: selectedPartnerId,
            message: newMessage.trim()
        };

        socket.current.emit('sendMessage', chatData);
        
        const tempMsg = {
            sender: user.userId,
            receiver: selectedPartnerId,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
            _id: Date.now()
        };
        setMessages([...messages, tempMsg]);
        setNewMessage('');
    };

    const selectConversation = async (conv) => {
        setSelectedPartnerId(conv.partnerId);
        setSelectedPartnerName(conv.partnerName);
        setSelectedPropertyContext(conv.propertyContext || '');
        markAsRead(conv.partnerId);
    };

    return (
        <div className={`container inbox-container glass-panel ${selectedPartnerId ? 'chat-open' : ''}`}>
            <div className="inbox-sidebar">
                <h3>Messages</h3>
                <div className="conversation-list">
                    {conversations.length === 0 ? (
                        <p className="empty-chat-msg">No active conversations found. Messaging starts after a confirmed booking.</p>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.partnerId} 
                                className={`conversation-item ${selectedPartnerId === conv.partnerId ? 'active' : ''}`}
                                onClick={() => selectConversation(conv)}
                            >
                                <div className="partner-avatar">
                                    {conv.partnerName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-top-row">
                                        <span className="conv-name">{conv.partnerName}</span>
                                        {conv.unreadCount > 0 && <span className="conv-unread-badge">{conv.unreadCount}</span>}
                                    </div>
                                    {conv.propertyContext && (
                                        <span className="conv-property-tag">🏠 {conv.propertyContext}</span>
                                    )}
                                    <span className="conv-previewText">{conv.lastMessage}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="chat-area">
                {selectedPartnerId ? (
                    <>
                        <div className="chat-header">
                            <button className="chat-back-btn" onClick={() => setSelectedPartnerId(null)}>←</button>
                            <div className="chat-header-info">
                                <div className="chat-partner-avatar-sm">
                                    {selectedPartnerName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 style={{margin: 0}}>
                                        {selectedPartnerName || 'User'}
                                    </h4>
                                    {selectedPropertyContext && (
                                        <span className="chat-property-context">🏠 Re: {selectedPropertyContext}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="chat-messages">
                            {loading ? (
                                <p>Loading history...</p>
                            ) : messages.length === 0 ? (
                                <div className="empty-chat-starter">
                                    <p>💬 Start your conversation with <strong>{selectedPartnerName}</strong></p>
                                    {selectedPropertyContext && (
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>regarding <strong>{selectedPropertyContext}</strong></p>
                                    )}
                                </div>
                            ) : (
                                messages.map((m, idx) => (
                                    <div 
                                        key={m._id || idx} 
                                        className={`message-bubble ${m.sender === user.userId ? 'sent' : 'received'}`}
                                    >
                                        <p>{m.message}</p>
                                        <span className="msg-time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="chat-input-row" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                placeholder={`Message ${selectedPartnerName || 'User'}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="btn-primary">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="icon">💬</div>
                        <p>Select a conversation from the sidebar to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
