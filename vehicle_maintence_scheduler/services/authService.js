const axios = require("axios");

async function getAccessToken() {

    try {

        const response = await axios.post(
            "http://20.207.122.201/evaluation-service/auth",
            {
                email: "ramkrishna@abc.edu",
                name: "ram krishna",
                rollNo: "aa1bb",
                accessCode: "xgAsNC",
                clientID: "d9cbb699-6a27-44a5-8d59-8b1befa816da",
                clientSecret: "tVJaaaRBSeXcRXeM"
            }
        );

        return response.data.access_token;

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

module.exports = getAccessToken;