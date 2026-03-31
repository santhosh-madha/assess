// server/controllers/property.js
const Property = require("../models/Property");
const Booking = require("../models/Booking");

// Create a new property listing
exports.createProperty = async (req, res) => {
    try {
        const { title, description, pricePerNight, propertyType, street, city, state, pincode, maxGuests, bedrooms, bathrooms, amenities, imageUrl, galleryImages } = req.body;

        const location = `${street}, ${city}, ${state} ${pincode}`;

        const newProperty = new Property({
            title,
            description,
            pricePerNight,
            propertyType,
            location,
            street,
            city,
            state,
            pincode,
            maxGuests,
            bedrooms,
            bathrooms,
            amenities,
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", // fallback
            galleryImages: galleryImages || [],
            ownerId: req.user.userId, // Authenticated via middleware
        });

        const savedProperty = await newProperty.save();
        res.status(201).json({ message: "Property created successfully", property: savedProperty });
    } catch (error) {
        console.error("Error creating property:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all properties with dynamic filters
exports.getAllProperties = async (req, res) => {
    try {
        const { location, guests, minPrice, maxPrice, propertyType, ownerId, checkIn, checkOut, sortPrice } = req.query;
        let queryFilters = {};

        if (ownerId) {
            queryFilters.ownerId = ownerId;
        }
        
        // Ensure properties can accommodate at least the requested number of guests
        if (guests) {
            queryFilters.maxGuests = { $gte: Number(guests) };
        }

        // Availability Filtering via Overlapping Bookings Check
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            const overlappingBookings = await Booking.find({
                $or: [
                    { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }
                ]
            }).select('propertyId');

            const bookedPropertyIds = overlappingBookings.map(b => b.propertyId);

            if (bookedPropertyIds.length > 0) {
                queryFilters._id = { $nin: bookedPropertyIds };
            }
        }
        if (propertyType && propertyType !== 'all') {
            queryFilters.propertyType = propertyType;
        }
        if (minPrice || maxPrice) {
            queryFilters.pricePerNight = {};
            if (minPrice) queryFilters.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) queryFilters.pricePerNight.$lte = Number(maxPrice);
        }

        // Fetch properties matching other constraints
        let properties = await Property.find(queryFilters).populate('ownerId', 'username email');

        // Location Filtering and Sorting Logic: Exact/Partial matches first
        if (location && location.trim() !== '') {
            const searchTerms = location.toLowerCase().trim().split(' ');
            
            // Map properties to calculate match scores and filter out absolute mismatches
            const scoredProperties = properties.map(property => {
                let score = 0;
                const locStr = property.location.toLowerCase();
                const exactMatchStr = location.toLowerCase().trim();
                
                // Exact substring match
                if (locStr.includes(exactMatchStr)) score += 100;
                
                // Partial term matches
                searchTerms.forEach(term => {
                    if (locStr.includes(term)) score += 10;
                });
                
                return { property, score };
            }).filter(item => item.score > 0);
            
            // Sort descending by score
            scoredProperties.sort((a, b) => b.score - a.score);
            
            // Extract the property documents back from the sorted array
            properties = scoredProperties.map(item => item.property);
        }

        // Apply Price Sorting
        if (sortPrice === 'asc') {
            properties.sort((a, b) => a.pricePerNight - b.pricePerNight);
        } else if (sortPrice === 'desc') {
            properties.sort((a, b) => b.pricePerNight - a.pricePerNight);
        }

        res.json(properties);
    } catch (error) {
        console.error("Error fetching properties:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get trending properties
exports.getTrendingProperties = async (req, res) => {
    try {
        const trendingProperties = await Property.aggregate([
            { $sample: { size: 6 } }
        ]);
        res.json(trendingProperties);
    } catch (error) {
        console.error("Error fetching trending properties:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get a single property by ID
exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('ownerId', 'username email');
        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json(property);
    } catch (error) {
        console.error("Error fetching property:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Update a property
exports.updateProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const ownerId = req.user.userId;

        // Verify property exists
        const propertyToUpdate = await Property.findById(propertyId);
        if (!propertyToUpdate) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Verify user owns the property
        if (propertyToUpdate.ownerId.toString() !== ownerId) {
            return res.status(403).json({ error: 'Unauthorized: You can only edit your own properties.' });
        }

        // Dynamically compute the overarching location string for search indexing if any underlying geo fields changed
        if (req.body.street || req.body.city || req.body.state || req.body.pincode) {
            const tempStreet = req.body.street !== undefined ? req.body.street : propertyToUpdate.street;
            const tempCity = req.body.city !== undefined ? req.body.city : propertyToUpdate.city;
            const tempState = req.body.state !== undefined ? req.body.state : propertyToUpdate.state;
            const tempPincode = req.body.pincode !== undefined ? req.body.pincode : propertyToUpdate.pincode;
            req.body.location = `${tempStreet}, ${tempCity}, ${tempState} ${tempPincode}`;
        }

        // Proceed to update
        const updatedProperty = await Property.findByIdAndUpdate(propertyId, req.body, { new: true, runValidators: true });
        res.json({ message: "Property updated successfully", property: updatedProperty });
    } catch (error) {
        console.error("Error updating property:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete a property
exports.deleteProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const ownerId = req.user.userId;

        // Verify property exists
        const propertyToDelete = await Property.findById(propertyId);
        if (!propertyToDelete) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Verify user owns the property
        if (propertyToDelete.ownerId.toString() !== ownerId) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete your own properties.' });
        }

        await Property.findByIdAndDelete(propertyId);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error("Error deleting property:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
