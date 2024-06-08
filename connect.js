import mysql from "mysql";

export const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "flohealthhubco_telemedicine"
});

export const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "flohealth_app_db"
});

export const dbCI = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "flohealthhubco_telemedicine"
});
/* 
export const dbCI = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "flohealthhubco_telemedicine"
}); */
