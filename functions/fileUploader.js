const bodyParser = require("body-parser");
const Busboy = require("busboy");
const getRawBody = require("raw-body");
const contentType = require("content-type");


module.exports = (path, app) => {
    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use((req, res, next) => {
        if (req.rawBody === undefined && req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
            getRawBody(req, {
                length: req.headers["content-length"],
                limit: "3mb",
                encoding: contentType.parse(req).parameters.charset
            }, function (err, string) {
                if (err) return next(err);
                req.rawBody = string;
                next();
            })
        } else {
            next();
        }
    });

    app.use((req, res, next) => {
        if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
            const busboy = new Busboy({ headers: req.headers });

            let fileBuffer = new Buffer("");

            req.files = {
                file: []
            };

            req.field = {};

            busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
                file.on("data", (data) => {
                    fileBuffer = Buffer.concat([fileBuffer, data]);
                });

                file.on("end", () => {
                    const file_object = {
                        fieldname,
                        originalname: filename,
                        encoding,
                        mimetype,
                        buffer: fileBuffer
                    };

                    req.files.file.push(file_object);

                    next();
                });
            });

            // --
            busboy.on("field", (fieldname, val) => {
                req.field[fieldname] = val;
                // console.log('Field [' + fieldname + ']: value: ' + val);
            });

            // --

            busboy.end(req.rawBody);
        } else {
            next();
        }
    });
};
