import {OpenAI} from 'openai';
import 'dotenv/config';

// Inicialize o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
