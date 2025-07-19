import express from 'express';
import Phone from '../models/phone.js';
import auth from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import { validatePhone, validateSale } from '../middleware/validation.js';

const router = express.Router();

// PUBLIC: Get all phones (no authentication required)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      modelNo,
      color,
      minPrice,
      maxPrice
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { modelNo: { $regex: search, $options: 'i' } },
        { imei1: { $regex: search, $options: 'i' } },
        { imei2: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { 'soldTo.customerName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (modelNo) query.modelNo = { $regex: modelNo, $options: 'i' };
    if (color) query.color = { $regex: color, $options: 'i' };
    
    if (minPrice || maxPrice) {
      query.purchasePrice = {};
      if (minPrice) query.purchasePrice.$gte = Number(minPrice);
      if (maxPrice) query.purchasePrice.$lte = Number(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const phones = await Phone.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Phone.countDocuments(query);

    res.json({
      success: true,
      message: 'Phones fetched successfully',
      data: phones,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching phones',
      error: error.message
    });
  }
});

// PUBLIC: Get single phone by ID (no authentication required)
router.get('/:id', async (req, res) => {
  try {
    const phone = await Phone.findOne({
      _id: req.params.id
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    res.json({
      success: true,
      message: 'Phone fetched successfully',
      data: phone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching phone',
      error: error.message
    });
  }
});

// PUBLIC: Search phones by model or IMEI (no authentication required)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const phones = await Phone.find({
      $or: [
        { modelNo: { $regex: query, $options: 'i' } },
        { imei1: { $regex: query, $options: 'i' } },
        { imei2: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      success: true,
      message: 'Phones matching search query fetched successfully',
      data: phones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching phones',
      error: error.message
    });
  }
});

// Add new phone
router.post('/', auth, upload.array('images', 5), uploadToCloudinary, validatePhone, async (req, res) => {
  try {
    const phoneData = {
      ...req.body,
      userId: req.user.id
    };
    
    // Add image information if files were uploaded
    if (req.files && req.files.length > 0) {
      phoneData.images = req.files.map(file => ({
        url: file.path, // Cloudinary URL
        public_id: file.filename || file.public_id, // fallback for compatibility
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    const phone = new Phone(phoneData);
    await phone.save();

    res.status(201).json({
      success: true,
      message: 'Phone added successfully',
      data: phone
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A phone with this IMEI or Serial Number already exists.',
        error: 'Duplicate entry'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error adding phone',
      error: error.message
    });
  }
});

// Update phone
router.put('/:id', auth, upload.array('images', 5), uploadToCloudinary, async (req, res) => {
  try {
    const phone = await Phone.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        phone[key] = req.body[key];
      }
    });

    // Handle optional sale fields (all possible soldTo fields)
    const {
      salePrice,
      customerName,
      customerMobile,
      customerAddress,
      paymentType,
      exchangeModel,
      exchangeModelIMEI,
      exchangeModelPrice,
      cashAmount,
      onlineAmount,
      saleDate
    } = req.body;
    if (salePrice !== undefined) {
      phone.salePrice = salePrice;
    }
    if (
      customerName ||
      customerMobile ||
      customerAddress ||
      paymentType ||
      exchangeModel ||
      exchangeModelIMEI ||
      exchangeModelPrice !== undefined ||
      cashAmount !== undefined ||
      onlineAmount !== undefined
    ) {
      phone.soldTo = {
        ...phone.soldTo,
        ...(customerName && { customerName }),
        ...(customerMobile && { customerMobile }),
        ...(customerAddress && { customerAddress }),
        ...(paymentType && { paymentType }),
        ...(exchangeModel && { exchangeModel }),
        ...(exchangeModelIMEI && { exchangeModelIMEI }),
        ...(exchangeModelPrice !== undefined && { exchangeModelPrice }),
        ...(cashAmount !== undefined && { cashAmount }),
        ...(onlineAmount !== undefined && { onlineAmount })
      };
      phone.markModified('soldTo');
    }
    if (saleDate !== undefined) {
      phone.soldDate = saleDate ? new Date(saleDate) : new Date();
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path, // Cloudinary URL
        public_id: file.filename || file.public_id,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
      phone.images = [...phone.images, ...newImages];
    }

    await phone.save();

    res.json({
      success: true,
      message: 'Phone updated successfully',
      data: phone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating phone',
      error: error.message
    });
  }
});

// Sell phone
router.post('/:id/sell', auth, validateSale, async (req, res) => {
  try {
    const phone = await Phone.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    // Check if phone is already sold
    if (phone.status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Phone is already sold'
      });
    }

    // Check if phone is in stock
    if (phone.status !== 'in_stock') {
      return res.status(400).json({
        success: false,
        message: 'Phone can only be sold if it is in stock'
      });
    }

    const { customerName, customerMobile, customerAddress, salePrice, paymentType, exchangeModel, exchangeModelIMEI, exchangeModelPrice, cashAmount, onlineAmount } = req.body;
    
    // Update sale price if provided
    if (salePrice) {
      phone.salePrice = salePrice;
    }

    // Build soldTo object with optional fields
    const soldTo = {
      ...(customerName && { customerName }),
      ...(customerMobile && { customerMobile }),
      ...(customerAddress && { customerAddress }),
      ...(paymentType && { paymentType }),
      ...(exchangeModel && { exchangeModel }),
      ...(exchangeModelIMEI && { exchangeModelIMEI }),
      ...(exchangeModelPrice && { exchangeModelPrice }),
      ...(cashAmount !== undefined && { cashAmount }),
      ...(onlineAmount !== undefined && { onlineAmount })
    };

    await phone.markAsSold(soldTo);

    res.json({
      success: true,
      message: 'Phone sold successfully',
      data: phone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error selling phone',
      error: error.message
    });
  }
});

// Delete phone
router.delete('/:id', auth, async (req, res) => {
  try {
    const phone = await Phone.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    res.json({
      success: true,
      message: 'Phone deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting phone',
      error: error.message
    });
  }
});

// Get phone statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Phone.getInventorySummary(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Remove image from phone
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const phone = await Phone.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Phone not found'
      });
    }

    phone.images = phone.images.filter(img => img._id.toString() !== req.params.imageId);
    await phone.save();

    res.json({
      success: true,
      message: 'Image removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing image',
      error: error.message
    });
  }
});

export default router;
