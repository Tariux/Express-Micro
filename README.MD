curl http://localhost:7001/_discovery/services \
     -H "Authorization: Bearer <KEY>



// SAMPLE DATA FOR METADATA

{
    "thisService": {
        "name": "orderService",
        "url": "http://192.168.218.1:7002",
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
    "authService": {
        "url": "http://192.168.218.1:7001",
        "routes": [
            {
                "path":"/profile/:id",
                
                "stack":[{"keys":[],"name":"getProfile","slash":false,"matchers":[null],"method":"get"}],
                "methods":{"get":true}}
,{"path":"/login","stack":[{"keys":[],"name":"loginUser","slash":false,"matchers":[null],"method":"post"
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