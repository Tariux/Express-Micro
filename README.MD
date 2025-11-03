curl http://localhost:6000/_discovery/services \
     -H "Authorization: Bearer <KEY>



// SAMPLE DATA FOR METADATA

{
    "thisService": {
        "name": "order-service",
        "url": "http://192.168.218.1:6001",
        "routes": [
            {
                "path": "/orders","stac
k":[{"keys":[],"name":"createOrder","slash":false,"matchers":[null],"method":"post"}],"methods":{"post":tr
ue
            }
        }
    ]
},
"connectedPeers": {
    "auth-service": {
        "url": "http://192.168.218.1:6000",
        "routes": [
            {
                "path":"/profile/:id","stack":[{"keys":[],"name":"getProfile","slash":false,"matchers":[null],"method":"get"}],"methods":{"get
":true}},{"path":"/login","stack":[{"keys":[],"name":"loginUser","slash":false,"matchers":[null],"method":"post"
            }
        ],
        "methods": {
            "post": true
        }
    }
],
"status": "UP"
}
}
}