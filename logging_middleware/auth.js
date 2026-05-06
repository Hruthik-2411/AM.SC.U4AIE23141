const axios = require("axios");

let accessToken = "";

async function getToken() {
    try {
        const response = await axios.post(
            "http://20.207.122.201/evaluation-service/auth",
            {
                email: "palivelahruthik@gmail.com",
                name: "Palivela Sai Hruthik",
                rollNo: "AM.SC.U4AIE23141",
                accessCode: "PTBMmQ",
                clientID: "52e086f6-688d-45e5-9bb1-865028f885a4",
                clientSecret: "GEUfDbNnkCQFbUgB"
            }
        );

        accessToken = response.data.access_token;

        console.log("Token Generated");

        return accessToken;

    } catch (error) {
        console.log("Auth Error");
        console.log(error.response?.data || error.message);
    }
}

module.exports = { getToken };