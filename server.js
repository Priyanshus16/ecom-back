import express from "express";
import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { memoryStorage } from "multer";
import fs from "fs/promises";
import fetch from "node-fetch";
dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

try {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB Connected"))
    .catch((err) => console.log("Error in url: ", err));
} catch (error) {
  console.log("DB not Connected");
}

const AdminSchema = Schema(
  {
    AdminUsername: {
      type: String,
    },
    AdminPassword: {
      type: String,
    },
  },
  { versionKey: false },
  { strict: false }
);

const CustomerSchema = Schema(
  {
    FirstName: {
      type: String,
      required: true,
    },
    LastName: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      reqired: true,
    },
    Mobile: {
      type: Number,
      reqired: true,
    },
    Gender: {
      type: String,
    },
    Address: {
      type: String,
    },
    City: {
      type: String,
    },
    State: {
      type: String,
    },
    ReferenceID: {
      type: String,
    },
    ReferenceBy: {
      type: String,
    },
    Password: {
      type: String,
      required: true,
    },
    Balance: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false },
  { strict: false }
);



const CategorySchema = new Schema(
  {
    CategoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { versionKey: false }
);
const Category = new model("Category", CategorySchema);

const SubCategorySchema = new Schema(
  {
    CategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Category
    },
    SubCategoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { versionKey: false }
);
const SubCategory = new model("SubCategory", SubCategorySchema);
const ProductSchema = Schema(
  {
    ProductName: {
      type: String,
    },
    ProductMRP: {
      type: Number,
    },
    ProductPrice: {
      type: Number,
    },
    ProductMainImgUrl: {
      type: String,
    },
    ProductShortDesc: {
      type: String,
    },
    ProductLongDesc: {
      type: String,
    },
    ProductCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Category
    },
    ProductSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SubCategory
    },  
    ProductBrand: {
      type: String,
    },
    ProductColor: {
      type: String,
    },
    ProductSize: {
      type: String,
    },
    ProductQuantity: {
      type: Number,
    },
    ProductDiscount: {
      type: Number,
    },
    ProductGST: {
      type: Number,
    },
    ProductHSN: {
      type: String,
    },
    Status: {
      type: String,
      default: "Accepted",
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
  { strict: false }
);

const Products = new model("Products", ProductSchema);
const OrderSchema = Schema(
  {
    UserId: {
      type: String,
    },
    ProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:Products
    },
    ProductMainImgUrl: {
      type: String,
    },
    ProductName: {
      type: String,
    },
    ProductPrice: {
      type: Number,
    },
    ProductColor: {
      type: String,
    },
    ProductSize: {
      type: String,
    },
    ProductQuantity: {
      type: Number,
    },
    Status: {
      type: String,
      default: "Pending",
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
  { strict: false }
);

const Admin = new model("Admin", AdminSchema);
const Customer = new model("Customer", CustomerSchema);
const Orders = new model("Orders", OrderSchema);

cloudinary.config({
  cloud_name: "dh5b8fjsp",
  api_key: "398511288372265",
  api_secret: "etL1OA3kXp8bhGGcGiYHRIOa5Q0",
});

const storage = memoryStorage();
const upload = multer({ storage: storage });

app.post("/Login", (req, res) => {
  try {
    const { Email, Password } = req.body;
    Customer.findOne({ $and: [{ Email }, { Password }] })
      .then((item) => {
        if (item !== null) {
          res.send({
            message: "Login Successfully",
            data: item,
            success: true,
          });
        } else {
          res.send({
            message: "Username or Password Incorrect",
            data: item,
            success: false,
          });
        }
      })
      .catch((err) => {
        res.send({ message: "Username or Password Incorrect" });
      });
  } catch {
    res.send({ message: "Customer Login Failed" });
  }
});

app.get("/getalluser", (req, res) => {
  try {
    Customer.find()
      .then((item) => {
        res.send(item);
      })
      .catch((err) => {
        res.send({ message: "Username or Password Incorrect" });
      });
  } catch {
    res.send({ message: "Customer Login Failed" });
  }
});

function generateReferenceID(firstName, lastName) {
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}-${randomString}`;
}

app.post("/Register", (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      Email,
      Mobile,
      Gender,
      Address,
      City,
      State,
      ReferenceBy,
      Password,
    } = req.body;
    const ReferenceID = generateReferenceID(FirstName, LastName);
    const customers = new Customer({
      FirstName,
      LastName,
      Email,
      Mobile,
      Gender,
      Address,
      City,
      State,
      ReferenceID,
      ReferenceBy,
      Password,
    });

    customers
      .save()
      .then((item) => {
        res.send({ message: "User Registered", data: item });
      })
      .catch((err) => {
        res.send({ message: "Try Again" });
      });
  } catch {
    res.send({ message: "Register Failed" });
  }
});

app.post("/AdminLogin", (req, res) => {
  try {
    const { AdminUsername, AdminPassword } = req.body;
    Admin.findOne({ $and: [{ AdminUsername }, { AdminPassword }] })
      .then((item) => {
        if (item !== null) {
          res.send({ message: "Admin Login Successfully", data: item });
        } else {
          res.send({ message: "Username or Password Incorrect", data: item });
        }
      })
      .catch((err) => {
        res.send({ message: "Admin Incorrect" });
      });
  } catch {
    res.send({ message: "Admin Login Failed" });
  }
});
app.post(
  "/AddProduct",
  upload.single("ProductMainImgUrl"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }
      const {
        ProductName,
        ProductMRP,
        ProductPrice,
        ProductShortDesc,
        ProductLongDesc,
        ProductCategory,
        ProductSubCategory,
        ProductBrand,
        ProductSize,
        ProductColor,
        ProductQuantity,
        ProductDiscount,
        ProductGST,
        ProductHSN,
      } = req.body;

      const base64String = req.file.buffer.toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64String}`,
        {
          folder: "Ecommerce",
          public_id: `product_images_${Date.now()}`,
        }
      );

      const ProductMainImgUrl = result.secure_url;

      const UploadProduct = new Products({
        ProductName,
        ProductMRP,
        ProductPrice,
        ProductMainImgUrl,
        ProductShortDesc,
        ProductLongDesc,
        ProductCategory,
        ProductSubCategory,
        ProductBrand,
        ProductSize,
        ProductColor,
        ProductQuantity,
        ProductDiscount,
        ProductGST,
        ProductHSN,
      });

      const savedProduct = await UploadProduct.save();
      res.send({ message: "Product Added", Data: savedProduct });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.delete("/deleteProduct/:id", (req, res) => {
  const { id } = req.params;
  try {
    Products.deleteOne({ _id: id })
      .then((item) => {
        res.send({ message: "Item Deleted" });
      })
      .catch((err) => {
        res.send({ message: "Error in Deleting" });
      });
  } catch {
    res.send({ message: "Error in Product Delete" });
  }
});

app.delete("/Orders/delete/:id", (req, res) => {
  const { id } = req.params;
  try {
    Orders.deleteOne({ _id: id })
      .then((item) => {
        res.send({ message: "Item Deleted" });
      })
      .catch((err) => {
        res.send({ message: "Error in Deleting" });
      });
  } catch {
    res.send({ message: "Error in Product Delete" });
  }
});

app.get("/getallproduct", (req, res) => {
  try {
    Products.find({ Status: { $eq: "Accepted" } })
      .sort({ created_at: -1 })
      .then((item) => {
        res.send({ data: item });
      })
      .catch((err) => {
        res.send("Can't Find Product");
      });
  } catch {
    res.send("db error");
  }
});
app.get("/getallproductById/:id", (req, res) => {
  try {
    const id = req.params.id;
       let query = { Status: { $eq: "Accepted" } }; 
    
    if (id !== "All") {
      query.ProductCategory = id;
    }
    
    Products.find(query)
      .sort({ created_at: -1 })
      .then((item) => {
        res.send({ data: item });
      })
      .catch((err) => {
        res.status(500).send("Can't Find Product");
      });
  } catch (err) {
    res.status(500).send("DB error");
  }
});
  
app.get("/getproduct/:id", (req, res) => {
  try {
    const { id } = req.params;
    Products.findOne({ _id: id }).populate("ProductSubCategory ProductCategory")
      .then((item) => {
        res.send({ data: item });
      })
      .catch((err) => {
        res.send("Can't Find Product");
      });
  } catch {
    res.send("db error");
  }
});

app.get("/getallproduct/Admin", (req, res) => {
  try {
    Products.find().populate("ProductSubCategory ProductCategory")
      .then((item) => {
        res.send({ data: item });
      })
      .catch((err) => {
        res.send("Can't Find Product");
      });
  } catch {
    res.send("db error");
  }
});
app.post("/sendOTP", (req, res) => {
  try {
    const { number, otp } = req.body;
    const apiKey = "8hr6gDk5D0uhtFVYC5qZWw"; // Use your API key here
    const apiSender = "MARSKY";
    const mobile = number; // Example mobile number
    const msg = `${otp} is your One-Time Password (OTP).\n-Sky Marketing`;
    const num = mobile;
    const ms = encodeURIComponent(msg);
    const url = `https://www.smsc.co.in/api/mt/SendSMS?APIKey=${apiKey}&senderid=${apiSender}&channel=2&DCS=0&flashsms=0&number=${num}&text=${ms}&route=44&EntityId=1101442370000075992&dlttemplateid=1107171851093422866`;
    fetch(url, {
      method: "POST",
      body: "",
    })
      .then((response) => response.text())
      .then((data) => {
        console.log("data-> ", data); // Assuming you want to log the response
        res.send({ data: data });
      })
      .catch((error) => {
        console.error("Error:", error);
        res.send({ error: error });
      });
  } catch {
    res.send("db error");
  }
});

app.post("/ProductUpdateStatus", (req, res) => {
  const { id, Statusmsg } = req.body;
  try {
    Products.updateOne({ _id: id }, { Status: Statusmsg })
      .then((item) => {
        res.send({ message: "Update Successfully" });
      })
      .catch((err) => {
        res.send({ message: "Can't Update Product" });
      });
  } catch {
    res.send("db error");
  }
});
app.post("/OrderUpdateStatus", (req, res) => {
  const { id, Statusmsg } = req.body;
  try {
    Orders.updateOne({ _id: id }, { Status: Statusmsg })
      .then((item) => {
        res.send({ message: "Update Successfully" });
      })
      .catch((err) => {
        res.send({ message: "Can't Update Product" });
      });
  } catch {
    res.send("db error");
  }
});
app.post("/UpdateProduct", (req, res) => {
  const { _id } = req.body;
  try {
    Products.updateOne({ _id: _id }, req.body)
      .then((item) => {
        res.send({ message: "Update Successfully" });
      })
      .catch((err) => {
        res.send({ message: "Can't Update Product" });
      });
  } catch {
    res.send("db error");
  }
});

app.get("/", (req, res) => {
  res.send(`GET Request Called`);
});

async function distributeRewards(customerID, purchaseAmount) {
  const customer = await Customer.findById(customerID);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const levels = [
    { percentage: 0.15, level: 1 },
    { percentage: 0.1, level: 2 },
    { percentage: 0.05, level: 3 },
  ];

  let currentCustomer = customer;
  for (let i = 0; i < levels.length; i++) {
    if (!currentCustomer.ReferenceBy) { console.log("customer not have refrreal"); break; }

    const referrer = await Customer.findOne({
      ReferenceID: currentCustomer.ReferenceBy,
    });
    if (referrer) {
      const reward = purchaseAmount * levels[i].percentage;
      referrer.Balance += reward;
      console.log(referrer.Balance);
      await referrer.save();
      currentCustomer = referrer;
    } else {
      break;
    }
  }
}
app.post("/Order/Placed", async (req, res) => {
  try {
    const userPurchases = {};

    await Promise.all(
      req.body.map(async (item) => {
        const {
          UserId,
          ProductId,
          ProductMainImgUrl,
          ProductName,
          ProductPrice,
          ProductColor,
          ProductSize,
          ProductQuantity,
          _id,
        } = item;

        const Order = new Orders({
          UserId,
          ProductId,
          ProductMainImgUrl,
          ProductName,
          ProductPrice,
          ProductColor,
          ProductSize,
          ProductQuantity,
          ProductId: _id,
        });

        await Order.save();

        // Calculate the total purchase amount for each user
        if (!userPurchases[UserId]) {
          userPurchases[UserId] = 0;
        }
        userPurchases[UserId] += ProductPrice * ProductQuantity;
      })
    );

    // Distribute rewards for each user
    await Promise.all(
      Object.keys(userPurchases).map(async (userId) => {
        const purchaseAmount = userPurchases[userId];
        await distributeRewards(userId, purchaseAmount);
      })
    );

    // Send a success response
    res.send({ message: "Order Placed" });
  } catch (error) {
    // Handle errors and send a failure response
    console.error(error);
    res.status(500).send({ message: "Order Fail" });
  }
});

app.get("/Orders/List", async (req, res) => {
  try {
    // Execute the query and await the result
    const resp = await Orders.find().populate("ProductId")

    // Check if there is any data
    if (resp && resp.length > 0) {
      res.send({ data: resp });
    } else {
      // If no data is found
      res.send({ message: "No orders found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "DB error" });
  }
});

app.get("/getuserdata/:id", async (req, res) => {
  try {
    // Execute the query and await the result
    const resp = await Customer.find({ _id: req.params.id });

    // Check if there is any data
    if (resp && resp.length > 0) {
      res.send({ data: resp });
    } else {
      // If no data is found
      res.send({ message: "No orders found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "DB error" });
  }
});

app.get("/Orders/:id", async (req, res) => {
  try {
    // Execute the query and await the result
    const resp = await Orders.find({ UserId: req.params.id }).populate("ProductId");

    // Check if there is any data
    if (resp && resp.length > 0) {
      res.send({ data: resp });
    } else {
      // If no data is found
      res.send({ message: "No orders found", data: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "DB error" });
  }
});

app.get("/getReference/:id", async (req, res) => {
  try {
    // Execute the query and await the result
    const resp = await Customer.find({ ReferenceBy: req.params.id });

    // Check if there is any data
    if (resp && resp.length > 0) {
      res.send({ data: resp });
    } else {
      // If no data is found
      res.send({ message: "No Reference found", data: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "DB error" });
  }
});

app.get("/getAddress/:id", (req, res) => {
  try {
    Customer.find({ _id: req.params.id })
      .then((item) => {
        res.send({ data: item });
      })
      .catch((err) => {
        res.send("Can't Find Address");
      });
  } catch {
    res.send("db error");
  }
});


// Read All Categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/mobileCategories", async (req, res) => {
  try {
    // Find all categories
    const categories = await Category.find({});
    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    // For each category, find linked subcategories
    const response = await Promise.all(
      categories.map(async (category) => {
        const subCategories = await SubCategory.find({ CategoryId: category._id });
        return {
          _id: category._id,
          CategoryName: category.CategoryName,
          description: category.description,
          image: category.image,
          SubCategories: subCategories.map((sub) => ({
            _id: sub._id,
            SubCategoryName: sub.SubCategoryName,
            description: sub.description,
            image: sub.image,
          })),
        };
      })
    );

    res.status(200).json({ Categories: response });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

app.get("/mobileCategories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Fetch all products for the given category ID
    const products = await Products.find({ ProductCategory: categoryId });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found for this category" });
    }

    // Group products by ProductName
    const groupedData = products.reduce((acc, product) => {
      // Check if the product name already exists in the accumulator
      let existingUnit = acc.find((unit) => unit.productName === product.ProductName);

      if (existingUnit) {
        // If the product name exists, push this product as a size variation
        existingUnit.unit.push({
          productSize: product.ProductSize,
          ...product._doc, // Include all details of the product
        });
      } else {
        // If the product name doesn't exist, create a new unit
        acc.push({
          productName: product.ProductName,
          unit: [
            {
              productSize: product.ProductSize,
              ...product._doc,
            },
          ],
        });
      }

      return acc;
    }, []);

    res.status(200).json({ data: groupedData });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

app.post("/categories", upload.single('image'), async (req, res) => {
  try {
    // Extract fields from the request body
    const { CategoryName, description } = req.body;
          const base64String = req.file.buffer.toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64String}`,
        {
          folder: "Ecommerce",
          public_id: `product_images_${Date.now()}`,
        }
      );

      const ProductMainImgUrl = result.secure_url;

    // Construct the new category object
    const category = new Category({
      CategoryName,
      description: description || "", // Default value if not provided
      image: ProductMainImgUrl ||  "", // Save image path if file uploaded
    });

    // Save the category to the database
    await category.save();

    res.status(201).send({ message: "Category created successfully!", category });
  } catch (error) {
    res.status(400).send({ error: error.message || "Error creating category" });
  }
});


// Update Category
app.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).send({ message: "Category not found" });
    res.status(200).send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete Category
app.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).send({ message: "Category not found" });
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create SubCategory
app.post("/subcategories", upload.single('image'), async (req, res) => {
  try {
    const { CategoryId, SubCategoryName, description } = req.body;
          const base64String = req.file.buffer.toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64String}`,
        {
          folder: "Ecommerce",
          public_id: `product_images_${Date.now()}`,
        }
      );

      const ProductMainImgUrl = result.secure_url;

    // Create a new subcategory object
    console.log(req.file)
    const subCategory = new SubCategory({
      CategoryId,
      SubCategoryName,
      description,
      image: ProductMainImgUrl, // Save the file path if uploaded
    });

    // Save to the database
    await subCategory.save();

    res.status(201).send({ message: "Subcategory created successfully!" });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Read All SubCategories
app.get("/subcategories", async (req, res) => {
  try {
    const subCategories = await SubCategory.find().populate("CategoryId");
    res.status(200).send(subCategories);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read Single SubCategory by ID
app.get("/subcategories/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate("CategoryId");
    if (!subCategory) return res.status(404).send({ message: "SubCategory not found" });
    res.status(200).send(subCategory);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update SubCategory
app.put("/subcategories/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subCategory) return res.status(404).send({ message: "SubCategory not found" });
    res.status(200).send(subCategory);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete SubCategory
app.delete("/subcategories/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) return res.status(404).send({ message: "SubCategory not found" });
    res.status(200).send({ message: "SubCategory deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, function () {
  console.log(`Backend is running on Port: ${PORT}`);
});
