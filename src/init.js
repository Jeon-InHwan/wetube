import "regenerator-runtime";
import "dotenv/config";
import "./db";
import "./models/Video";
import "./models/User";
import "./models/Comment";
import app from "./server";

const PORT = 4000;

const handleListening = () => {
  console.log(`✅ Server listening on port http://localhost:${PORT} 🚀`);
};

app.listen(PORT, handleListening);

/*
    For the DB process, You have to write some command lines below.
    1. mongostart => sudo service mongodb start 
    2. mongostop => sudo service mongodb stop
    3. mongostatus sudo service mongodb status
*/
