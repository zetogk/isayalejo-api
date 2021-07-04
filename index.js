const { v4: uuidv4 } = require("uuid");
const utils = require("./utils");

const start = async () => {
  try {
    const fastify = require("fastify")({ logger: true });
    const fileUpload = require("fastify-file-upload");

    const port = process.env.PORT;

    console.log("process.env.MONGOURI::: ", process.env.MONGOURI);
    console.log("process.env.PORT::: ", process.env.PORT);

    fastify.register(require("fastify-mongodb"), {
      // force to close the mongodb connection when app stopped
      // the default value is false
      forceClose: true,
      //url: 'mongodb://localhost:27030/isayalejo'
      url: process.env.MONGOURI,
    });

    fastify.get("/health", async function (req, reply) {
      reply.send({
        data: {
          date: Date.now(),
        },
        status: "ok",
        message: "API working",
      });
    });

    fastify.get("/initdata", async function (req, reply) {
      const db = this.mongo.db;
      const initialData = require("./initialdata.json");
      const coll = await db.collection("guests");
      console.log("initialData.length::: ", initialData.length);

      for (let $i = 0; $i < initialData.length; $i++) {
        const data = initialData[$i];
        await coll.insertOne(data);
      }

      reply.send({
        status: "Finished",
      });
    });

    fastify.get("/guests", async function (req, reply) {
      try {
        const db = this.mongo.db;
        const coll = await db.collection("guests");
        const guests = await coll.find({}).toArray();

        console.log("guests: ", guests);

        reply.send({
          data: guests,
          status: "ok",
          message: "",
        });
      } catch (err) {
        console.error("Error /guests: ", err);

        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    fastify.put("/guests/:slug/confirmation", async function (req, reply) {
      const { slug } = req.params;

      const db = this.mongo.db;
      const coll = await db.collection("guests");

      try {
        const invitation = await coll.findOne({ slug });
        invitation.status = "confirmado";
        await coll.updateOne(
          { slug },
          {
            $set: {
              status: "confirmado",
            },
          }
        );

        reply.send({
          data: invitation,
          status: "ok",
          message: "",
        });
      } catch (err) {
        console.error("Error updating guest: ", err);

        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    fastify.get("/guests/:slug", async function (req, reply) {
      const { slug } = req.params;

      const db = this.mongo.db;
      const coll = await db.collection("guests");

      try {
        const guest = await coll.findOne({ slug });

        if (guest == null) {
          reply.send({
            data: null,
            status: "error",
            message: "Not found",
          });
        }
        reply.send({
          data: guest,
          status: "ok",
          message: "",
        });
      } catch (err) {
        console.error("Error updating guest: ", err);

        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    fastify.register(fileUpload);

    fastify.post("/photos", async function (req, reply) {
      const validExtension = ["jpg", "png", "jpeg", "gif"];

      const db = this.mongo.db;
      const coll = await db.collection("photos");

      try {
        const uuidPhoto = uuidv4();

        const files = req.raw.files;

        if (files.photo) {
          const splitResult = files.photo.name.split(".");
          const extension = splitResult[splitResult.length - 1];

          if (!validExtension.includes(extension)) {
            reply.send({
              data: null,
              status: "error",
              message: "Formato no válido",
            });
            return;
          }

          const photoName = `${uuidPhoto}.${extension}`;
          const pathPhoto = `./media/${photoName}`;

          await files.photo.mv(pathPhoto);
          const responseS3 = await utils.uploadFile(
            pathPhoto,
            photoName,
            false
          );

          coll.insertOne({
            tags: req.body.tags.split(","),
            url: responseS3,
            active: false,
          });
        }

        reply.send({
          data: null,
          status: "ok",
          message: "Imagen subida, pronto aparecerá",
        });
      } catch (err) {
        console.error("Error updating photo: ", err);

        reply.code(500);
        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    fastify.get("/photos", async function (req, reply) {
      const db = this.mongo.db;
      const coll = await db.collection("photos");

      try {
        const photos = await coll.find({}).toArray();

        reply.send({
          data: photos,
          status: "ok",
          message: "Imágenes obtenidas",
        });
      } catch (err) {
        console.error("Error getting photo: ", err);

        reply.code(500);
        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    fastify.get("/photos/:active", async function (req, reply) {
      const db = this.mongo.db;
      const coll = await db.collection("photos");

      try {
        const { active } = req.params;
        const photos = await coll.find({active: active == 'true'}).toArray();

        reply.send({
          data: photos,
          status: "ok",
          message: "Imágenes obtenidas",
        });
      } catch (err) {
        console.error("Error getting photos: ", err);

        reply.code(500);
        reply.send({
          data: null,
          status: "error",
          message: err.message,
        });
      }
    });

    await fastify.listen(port || 3000);
    console.log(`server listening on ${fastify.server.address().port}`);

    /* await fastify.listen(port || 3000);
    fastify.log.info(`server listening on ${fastify.server.address().port}`); */
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();
