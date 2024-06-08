/* import { client } from "@gradio/client";

const app = await client("deepseek-ai/DeepSeek-VL-7B");
const result = await app.predict("/predict", [		
				[["Hello!",null]], // undefined  in 'parameter_11' Chatbot component		
				0, // number (numeric value between 0 and 1.0) in 'Top-p' Slider component		
				0, // number (numeric value between 0 and 1.0) in 'Temperature' Slider component		
				0, // number (numeric value between 0.0 and 2.0) in 'Repetition penalty' Slider component		
				0, // number (numeric value between 0 and 2048) in 'Max Generation Tokens' Slider component		
				0, // number (numeric value between 0 and 2048) in 'Max History Tokens' Slider component		
				"DeepSeek-VL 7B", // string  in 'Select Models' Dropdown component
	]);

console.log(result.data); 
*/
import { client } from "@gradio/client";

const response_0 = await fetch("https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png");
const exampleImage = await response_0.blob();
						
const app = await client("deepseek-ai/DeepSeek-VL-7B");
const result = await app.predict("/transfer_input", [		
				"Hello!!", // string  in 'parameter_14' Textbox component
				exampleImage, 	// blob in 'parameter_24' Image component
	]);

console.log(result.data);