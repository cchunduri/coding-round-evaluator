'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const fullName = requestBody.fullname;
  const email = requestBody.email;
  const experience = requestBody.experience;

  if (typeof fullName !== 'string' || typeof email !== 'string' || typeof experience !== 'number') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit candidate because of validation errors.'));
    return;
  }

  submitCandidateP(candidateInfo(fullName, email, experience))
      .then(res => {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            message: `Successfully submitted candidate with email ${email}`,
            candidateId: res.id
          })
        });
      })
      .catch(err => {
        console.log(err);
        callback(null, {
          statusCode: 500,
          body: JSON.stringify({
            message: `Unable to submit candidate with email ${email}`
          })
        })
      });
};


const submitCandidateP = candidate => {
  console.log('Submitting candidate');
  const candidateInfo = {
    TableName: process.env.CANDIDATE_TABLE,
    Item: candidate,
  };
  return dynamoDb.put(candidateInfo).promise()
      .then(res => candidate);
};

const candidateInfo = (fullName, email, experience) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    fullname: fullName,
    email: email,
    experience: experience,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};