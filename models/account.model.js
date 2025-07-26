const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const accountSchema = mongoose.Schema({
    email: String,
    password: String,
    phone: String,
    image: String,
    active: Boolean,
    verify_token: String,
    role: String
});

accountSchema.pre('save', async function(next){
    if(!this.isModified('password'))
        next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

module.exports = mongoose.model('accounts', accountSchema);