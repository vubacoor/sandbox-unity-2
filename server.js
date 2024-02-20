const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const fs = require("fs");
const stringify = require("csv-stringify");
const port = 8000;
// Use the whole root as static files to be able to serve the html file and
// the build folder
app.use(express.static(path.join(__dirname, "/")));
// Send html on '/'path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, +"/index.html"));
});

app.get("/csv-download", async (req, res) => {
  const path = "data.csv";
  const stat = fs.statSync(path);

  let data = [];
  let columns = {
    id: "id",
    name: "Name",
  };

  for (var i = 0; i < 10; i++) {
    data.push([i, "Name " + i]);
  }

  stringify.stringify(
    data,
    { header: true, columns: columns },
    (err, output) => {
      if (err) throw err;
      fs.writeFile(path, output, (err) => {
        if (err) throw err;
        console.log("csv saved.");
      });
    }
  );

  fs.writeFile(path, "asda1", () => {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="test.csv"`,
    });

    var readStream = fs.createReadStream(path);

    readStream.pipe(res); 
  });
});

// Create the server and listen on port
http.createServer(app).listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
