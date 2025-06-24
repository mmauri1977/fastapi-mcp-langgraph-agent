from langchain_mcp_adapters.client import MultiServerMCPClient

MCP_SERVERS = {
    "weather": {
        # make sure you start your weather server on port 8000
        "url": "http://127.0.0.1:8002/mcp/",
        "transport": "streamable_http",
    },
    "MongoDB": {
        "command": "npx",
        "args": [
            "-y",
            "mongodb-mcp-server",
            "--connectionString",
            "mongodb://admin:password123@localhost:27017/myapp?authSource=admin"
        ],
        "transport": "stdio",
    }
}

async def initialize_MCP_tools() -> list:
    client = MultiServerMCPClient(MCP_SERVERS)
    TOOLS = await client.get_tools()
    print(f"Initialized {len(TOOLS)} tools from MCP servers.")
    return TOOLS
