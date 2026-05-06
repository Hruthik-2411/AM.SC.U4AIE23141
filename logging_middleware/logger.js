const axios = require("axios");
const { getToken } = require("./auth");

async function Log(stack, level, packageName, message) {

    try {

        const token = await getToken();

        const response = await axios.post(
            "http://20.207.122.201/evaluation-service/logs",
            {
                stack: stack,
                level: level,
                package: packageName,
                message: message
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log("Log Created");
        console.log(response.data);

    } catch (error) {

        console.log("Logger Error");

        console.log(error.response?.data || error.message);
    }
}

module.exports = Log;