import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import dbConnection from "./DbConfig/index.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import router from "./routes/index.js";

const __dirname = path.resolve(path.dirname("")); // path to root folder of project
dotenv.config();
const app = express();
app.use(express.static(path.join(__dirname, "./views/build")));
const PORT = process.env.PORT || 8800;

dbConnection(); //connect to database

app.use(helmet()); // secure Express apps by setting various HTTP headers

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(router);
app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
