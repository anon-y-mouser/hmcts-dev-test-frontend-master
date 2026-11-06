import axios from 'axios';
import { Application } from 'express';

interface CaseItem {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate: string;
}

export default function (app: Application): void {
  app.get('/', async (req, res) => {
    try {
      // An example of connecting to the backend (a starting point)
      const response = await axios.get('http://localhost:4000/cases/');
      console.log(response.data);
      res.render('home', { example: response.data });
    } catch (error) {
      console.error('Error making request:', error);
      res.render('home', {});
    }
  });

  app.get('/cases/new', (req, res) => {
    res.render('new', { form: {} });
  });

  app.post('/cases', async (req, res) => {
    if (typeof req.body.description !== 'string' || req.body.description.length > 2000) {
      res.status(400).render('new', {
        form: req.body,
        descriptionError: { text: 'Description must be 2000 characters or fewer.' }
      });
      return;
    }

    try {
      await axios.post('http://localhost:4000/cases/', {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
      });
      res.redirect('/');
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(502).send('Unable to create case. Please try again later.');
    }
  });

  app.post('/cases/:id/delete', async (req, res) => {
    try {
      await axios.delete(`http://localhost:4000/cases/${encodeURIComponent(req.params.id)}`);
      res.redirect('/');
    } catch (error) {
      console.error('Error deleting case:', error);
      res.status(502).send('Unable to delete case. Please try again later.');
    }
  });

  app.get('/cases/:id/edit', async (req, res) => {
    try {
      const response = await axios.get<CaseItem[]>('http://localhost:4000/cases/');
      const item = response.data.find(record => String(record.id) === req.params.id);

      if (!item) {
        res.sendStatus(404);
        return;
      }

      res.render('edit', { item });
    } catch (error) {
      console.error('Error loading case for editing:', error);
      res.status(502).send('Unable to load case. Please try again later.');
    }
  });

  app.post('/cases/:id/edit', async (req, res) => {
    if (typeof req.body.description !== 'string' || req.body.description.length > 2000) {
      res.status(400).render('edit', {
        item: { ...req.body, id: req.params.id },
        descriptionError: { text: 'Description must be 2000 characters or fewer.' }
      });
      return;
    }

    try {
      await axios.put(`http://localhost:4000/cases/${encodeURIComponent(req.params.id)}`, {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
      });
      res.redirect('/');
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(502).send('Unable to update case. Please try again later.');
    }
  });
}
