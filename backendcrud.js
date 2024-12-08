const express = require("express");
const Sequelize = require("sequelize");
const app = express();
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { type } = require("os");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWTkey = process.env.JWTkey;

console.log("hello", JWTkey);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    // methods: ["PUT,DELETE,OPTIONS"],
    credentials: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./imageFile");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.use("/images", express.static(path.join(__dirname, "imageFile")));

app.use(express.json());

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite", //choose sql to talk with
  storage: "./Database/Movies.sqlite",
});

const Movies = sequelize.define("movie", {
  movie_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  director: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  desc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  release_date: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  rating: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  genre: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  running_time: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  imageFile: {
    type: Sequelize.STRING,
    defaultValue: "600x300.png",
    allowNull: true,
  },
  teaser_url: {
    type: Sequelize.STRING,
    defaultValue: "https://www.youtube.com/watch?v=Gu6btHfa0wI",
    allowNull: true,
  },
});

const User = sequelize.define("user", {
  user_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  roles: {
    type: Sequelize.STRING,
    defaultValue: "User",
    allowNull: false,
  },
});

sequelize.sync({}); //if table not exist create

app.get("/movies", (req, res) => {
  Movies.findAll() //select * from
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/movieupdate/", (req, res) => {
  Movies.findAll() //select * from
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/moviedelete/", (req, res) => {
  Movies.findAll() //select * from
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/movie/:id", (req, res) => {
  Movies.findByPk(req.params.id)
    .then((movie) => {
      let ar = [movie];
      // console.log(review, movie, users);
      console.log(movie);

      res.json(ar);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/movies", upload.single("imageFile"), (req, res) => {
  // console.log(req.body);
  Movies.create({
    title: req.body.title,
    director: req.body.director,
    desc: req.body.desc,
    type: req.body.type,
    release_date: req.body.release_date,
    rating: req.body.rating,
    running_time: req.body.running_time,
    genre: req.body.genre,
    teaser_url: req.body.teaser_url,
    imageFile: req.file.filename,
  })
    .then((movie) => {
      res.send(movie);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
  // console.log(req.file);
});

app.put("/movie/:id", upload.single("imageFile"), (req, res) => {
  Movies.findByPk(req.params.id)
    .then((movie) => {
      if (!movie) {
        res.status(404).send("Movie not found");
      } else {
        if (req.file && req.file.filename) {
          console.log(req.file.filename);
          req.body.imageFile = req.file.filename;

          // ลบไฟล์เก่าออกจากระบบ (เฉพาะเมื่อมีการอัพโหลดไฟล์ใหม่)
          const imagePath = path.join(
            __dirname,
            `/imageFile/${movie.imageFile}`
          );
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.log("Error deleting file:", err);
            } else {
              console.log("File deleted successfully");
            }
          });
        } else {
          req.body.imageFile = movie.imageFile;
        }

        // อัปเดตข้อมูลของหนังในฐานข้อมูล
        movie
          .update(req.body)
          .then(() => {
            console.log(req);
            res.send(movie);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.delete("/movie/:id", (req, res) => {
  Movies.findByPk(req.params.id)
    .then((movie) => {
      if (!movie) {
        res.status(404).send("Movie not found");
      } else {
        if (movie.imageFile) {
          const imagePath = path.join(
            __dirname,
            `/public/images/${movie.imageFile}`
          );
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.log("Error deleting file:", err);
            } else {
              console.log("File deleted successfully");
            }
          });
        }
        movie
          .destroy()
          .then(() => {
            res.send({});
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/register", upload.single(""), async (req, res) => {
  const exist = await User.findOne({ where: { name: req.body.name } });
  if (exist) return res.json({ message: "al" });
  else {
    User.create(req.body)
      .then((user) => {
        res.send(user);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

app.post("/login", upload.single(""), async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ where: { name } });
    if (!user) return res.json({ message: "User_not_found" });

    if (user.password !== password)
      return res.json({ message: "Wrong_Password" });

    const payload = {
      name: user.name,
      roles: user.roles,
      profilePicture: user.profilePicture,
    };

    const token = jwt.sign(payload, JWTkey, { expiresIn: "1h" });

    return res.status(200).json({ message: true, token });
  } catch (error) {
    console.error(error);
    console.log("hello");

    return res.status(500).json({ error: "Server_error" });
  }
});

app.get("/user/:id", (req, res) => {
  User.findByPk(req.params.id)
    .then((users) => {
      if (!users) {
        res.status(404).send("users not found");
      } else {
        res.json(users);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/user/:id", (req, res) => {
  User.findByPk(req.params.id)
    .then((user) => {
      if (!user) {
        res.status(404).send("user not found");
      } else {
        user
          .update(req.body)
          .then(() => {
            console.log(req.body);
            res.send(user);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Listening on port http://localhost:${port}...`)
);
