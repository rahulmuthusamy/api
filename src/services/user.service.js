const { generateAccessToken, generateRefreshToken } = require('../utils/jwt')
const handleLogin = async (payload) => {
 
    let isLogin = false;
    if ('Admin' === 'Admin' && 'admin' === 'admin') {
        isLogin = true;
    }
    payload = {
        name: 'Rahul M',
        email: 'rahul@gmail.com'
    }
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return { payload, accessToken, refreshToken };

}

const handleLogout = async () => {


}
const handleRefreshToken = async () => {

}

module.exports = { handleLogin, handleLogout, handleRefreshToken }