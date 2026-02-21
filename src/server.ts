import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5477;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/blackrock/challenge/v1', routes);

// Healthcheck
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
