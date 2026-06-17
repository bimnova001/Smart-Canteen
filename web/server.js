const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());

app.use(express.json());

// Web folder

app.use(express.static(path.join(__dirname, "public")));

// =====================
// Get AI data
// =====================

app.get("/api/data", async (req, res) => {
  try {
    const result = await axios.get("http://localhost:8000/data");

    res.json(result.data);
  } catch (err) {
    res.status(500).json({
      error: "FastAPI offline",
    });
  }
});



app.get("/api/analyze", async (req, res) => {
  try {
    const result = await axios.get("http://localhost:8000/analyze");

    res.json(result.data);
  } catch (err) {
    res.status(500).json({
      error: "AI error",
    });
  }
});

app.get("/api/history", async(req,res)=>{

    const result =
    await axios.get(
        "http://localhost:8000/history"
    );

    res.json(result.data);

});


app.get("/video", (req, res) => {
  res.redirect("http://localhost:8000/video");
});

app.listen(3000, () => {
  console.log("Web server running http://localhost:3000");
});
