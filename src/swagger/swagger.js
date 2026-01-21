const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
    info: {
        title: 'MY API',
        description: 'API documentation for Hospital Management System',
    },
    host: 'localhost:3000/api',
    schemes: ['http'],
    tags: [
        {
            name: 'Auth',
            description: 'Authentication Endpoints',
        },
        {
            name: 'Users',
            description: 'User Management',
        },
    ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
