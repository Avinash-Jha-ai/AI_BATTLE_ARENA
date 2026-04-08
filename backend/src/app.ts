import express from 'express';
import runGraph from "./ai/graph.ai.js"
import cors from "cors"
import config from './config/config.js';

const app = express();
app.use(express.json())
app.use(cors({
    origin: config.frontend_url || "https://ai-battle-arena-nine.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
}))


app.get('/', async (req, res) => {

    const result = await runGraph("Write an code for Factorial function in js")

    res.json(result)
})

app.post("/invoke", async (req, res) => {

    const { input } = req.body
    const result = await runGraph(input)

    res.status(200).json({
        message: "Graph executed successfully",
        success: true,
        result
    })

})



export default app;