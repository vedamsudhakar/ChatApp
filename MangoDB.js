const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://ChatApp_June_26:ChatAppJune26@cluster0.uenyr.mongodb.net/ChatApp?retryWrites=true&w=majority";



module.exports.users = async function () {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const users = client.db("ChatApp").collection("Users");
        return await users.find().toArray();
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}

module.exports.addUser = async function (userObject) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const users = client.db("ChatApp").collection("Users");
        var results = await users.find({ UserName: userObject.UserName }).toArray();
        if (results.length > 0) {
            return {
                status: false,
                message: 'Username already exists'
            };
        }
        else {
            var result = await users.insertOne(userObject);
            return {
                id: result.insertedId,
                status: true,
                message: 'Ok'
            };
        }
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}

module.exports.deleteUser = async function (userObject) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const users = client.db("ChatApp").collection("Users");
        var results = await users.find({ UserName: userObject.UserName }).toArray();
        if (results.length > 0) {
            var result = await users.deleteOne({ UserName: userObject.UserName });
            return {
                status: true,
                message: 'User deleted successfully'
            };
        }
        else {
            return {
                status: false,
                message: 'User not exists'
            };
        }
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}

module.exports.addMessage = async function (message) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const messages = client.db("ChatApp").collection("Messages");
        var result = await messages.insertOne(message);
        return {
            id: result.insertedId,
            status: true,
            message: 'Ok'
        };
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}

module.exports.userMessages = async function (fromPerson, toPerson) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const messages = client.db("ChatApp").collection("Messages");
        return await messages.find({ $or: [{ from: fromPerson, to: toPerson }, { from: toPerson, to: fromPerson }] }).toArray();
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}

module.exports.verifyUser = async function (userObject) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const users = client.db("ChatApp").collection("Users");
        var results = await users.find({ UserName: userObject.UserName, Password: userObject.Password }).toArray();
        if (results.length > 0) {
            return {
                status: true,
                message: 'Ok',
                user: results[0]
            };
        }
        else {
            return {
                status: false,
                message: 'Invalid credentials'
            };
        }
    }
    catch (e) {
        console.log(e.message);
    }
    finally {
        client.close();
    }
}