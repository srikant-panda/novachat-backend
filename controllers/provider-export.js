import { googeleLoginHandler,googleCallbackHandler } from "./auth.strategies/googleLoginController.js";


const provider = {
    google:{
        handler:googeleLoginHandler,
        callback:googleCallbackHandler
    }
}

export default provider;