const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { v4: uuidv4 } = require("uuid");
const utils = require("./utils");
const fileUpload = require("express-fileupload");

var MongoClient = require("mongodb").MongoClient;

const cors = require("cors");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS, PATCH");
  next();
});

app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", async function (req, res) {
  res.send({
    data: {
      date: Date.now(),
    },
    status: "ok",
    message: "API working",
  });
});

app.get("/initdata", async function (req, res) {
  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db("isayalejo");

  //const db = this.mongo.db;
  const initialData = require("./initialdata.json");
  const coll = await db.collection("guests");
  console.log("initialData.length::: ", initialData.length);

  for (let $i = 0; $i < initialData.length; $i++) {
    const data = initialData[$i];
    await coll.insertOne(data);
  }

  res.send({
    status: "Finished",
  });
});

app.get("/guests", async function (req, res) {
  try {
    const client = await MongoClient.connect(process.env.MONGOURI);
    const db = client.db("isayalejo");
    const coll = await db.collection("guests");
    const guests = await coll.find({}).toArray();

    console.log("guests: ", guests);

    res.send({
      data: guests,
      status: "ok",
      message: "",
    });
  } catch (err) {
    console.error("Error /guests: ", err);

    res.send({
      data: null,
      status: "error",
      message: err.message,
    });
  }
});

app.put("/guests/:slug/confirmation/:confirmation", async function (req, res) {
  const { slug, confirmation } = req.params;

  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db("isayalejo");
  const coll = await db.collection("guests");

  try {
    const invitation = await coll.findOne({ slug });
    await coll.updateOne(
      { slug },
      {
        $set: {
          status:
            confirmation.toLowerCase() == "yes"
              ? "confirmado-asiste"
              : "confirmado-no-asiste",
          updatedAt: Date.now(),
        },
      }
    );

    res.send({
      data: invitation,
      status: "ok",
      message: "",
    });
  } catch (err) {
    console.error("Error updating guest: ", err);

    res.send({
      data: null,
      status: "error",
      message: err.message,
    });
  }
});

app.get("/guests/:slug", async function (req, res) {
  const { slug } = req.params;

  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db("isayalejo");
  const coll = await db.collection("guests");

  try {
    const guest = await coll.findOne({ slug });

    if (guest == null) {
      res.send({
        data: null,
        status: "error",
        message: "Not found",
      });
    }
    res.send({
      data: guest,
      status: "ok",
      message: "",
    });
  } catch (err) {
    console.error("Error updating guest: ", err);

    res.send({
      data: null,
      status: "error",
      message: err.message,
    });
  }
});

app.post("/photos", async function (req, res) {
  const validExtension = ["jpg", "png", "jpeg", "gif"];

  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db("isayalejo");
  const coll = await db.collection("photos");

  try {
    // const guest = await coll.findOne({ slug });

    if (req.files.photo) {
      const uuidPhoto = uuidv4();
      const photo = req.files.photo;

      const splitResult = photo.name.split(".");
      const extension = splitResult[splitResult.length - 1];

      if (!validExtension.includes(extension)) {
        res.send({
          data: null,
          status: false,
          message: "Formato de archivo no válido",
        });
        return;
      }

      const photoName = `${uuidPhoto}.${extension}`;
      const pathPhoto = `./media/${photoName}`;

      await photo.mv(pathPhoto);
      const responseS3 = await utils.uploadFile(pathPhoto, photoName, false);

      coll.insertOne({
        tags: req.body.tags.split(","),
        url: responseS3,
        active: false,
      });

      res.send({
        data: responseS3,
        status: true,
        message: "La imagen se ha subido correctamente",
      });
      return;
    }

    res.send({
      data: null,
      status: false,
      message: "No se han subido archivos",
    });
  } catch (err) {
    console.error("Error uploading photo: ", err);

    res.send({
      data: null,
      status: "error",
      message: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
