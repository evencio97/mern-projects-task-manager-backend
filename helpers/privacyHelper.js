'use strict'

function userPrivacy(data){
    data.password= undefined;
    data.sessions= undefined;
    data.session= undefined;
    return data;
}

function sessionPrivacy(data){
    return data;
}

function projectPrivacy(data){
    return data;
}

module.exports = {
    userPrivacy,
    sessionPrivacy,
    projectPrivacy
};