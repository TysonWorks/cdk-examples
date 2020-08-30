const mysql = require("mysql2/promise");
const { RDS } = require("aws-sdk");
const { sleep } = require("./lib");

async function handler(event, context, callback) {
  console.log(process.env);
  try {
    const { REGION, DB_HOST, DB_PORT, DB_USER, PROXY_HOST, DB_NAME } = process.env;
    const rdsSigner = new RDS.Signer({
      region: REGION,
      hostname: PROXY_HOST,
      port: +DB_PORT,
      username: DB_USER,
    });

    const authToken = rdsSigner.getAuthToken({
      username: DB_USER,
    });

    for (let i = 0; i < 120; i++) {
      const connection = await mysql.createConnection({
        host: PROXY_HOST,
        user: DB_USER,
        database: DB_NAME,
        port: +DB_PORT,
        password: authToken,
        ssl: { rejectUnauthorized: false },
        authSwitchHandler: function (data, callback) {
          if (data.pluginName === "mysql_clear_password") {
            let password = authToken + "\0";
            let buffer = Buffer.from(password);
            callback(null, password);
          }
        },
      });

      connection.on("connect", () => {
        console.log("Connected to database");
      });

      connection.on("end", () => {
        console.log("Connection closed");
      });

      connection.on("error", (err) => {
        console.error("Error", err);
      });
      await connection.execute("SHOW DATABASES")
      await sleep(1000);
      connection.end();
    }

    callback(null, "done");
  } catch (err) {
    console.error(err);
    callback(err);
  }
}

module.exports = {
  handler,
};
