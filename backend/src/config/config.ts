import dontenv from "dotenv";

dontenv.config();


/**
 * gemini api :
 * mistral api :
 * cohere api :
 */


type CONFIG ={
    readonly GOOGLE_API_KEY :String,
    readonly MISTRALAI_API_KEY :String,
    readonly COHERE_API_KEY :String
}


const config :CONFIG={
    GOOGLE_API_KEY:process.env.GOOGLE_API_KEY || "",
    MISTRALAI_API_KEY:process.env.MISTRALAI_API_KEY || "",
    COHERE_API_KEY:process.env.COHERE_API_KEY ||""
}

export default config;