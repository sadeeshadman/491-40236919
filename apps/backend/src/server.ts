import 'dotenv/config';
import express from 'express';
import { commentsRouter } from './routes/comments';
import { healthRouter } from './routes/health';
import { inspectionsRouter } from './routes/inspections';
import { quotesRouter } from './routes/quotes';
import { uploadRouter } from './routes/upload';

const app = express();

app.disable('x-powered-by');

app.use(express.json());
app.use('/api/health', healthRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/upload-image', uploadRouter);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
