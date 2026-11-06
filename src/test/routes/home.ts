import axios, { AxiosHeaders, type AxiosResponse } from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

interface CaseItem {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate: string;
}

const caseItem: CaseItem = {
  id: 1,
  title: 'Review application',
  description: 'Review submitted documents',
  status: 'OPEN',
  dueDate: '2026-11-15T17:00:00'
};

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: new AxiosHeaders() }
});

describe('Case routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists cases and links to add, edit, and delete actions', async () => {
    jest.mocked(axios.get).mockResolvedValue(axiosResponse([caseItem]));

    const response = await request(app).get('/').expect(200);

    expect(response.text).toContain('Review application');
    expect(response.text).toContain('Review submitted documents');
    expect(response.text).toContain('OPEN');
    expect(response.text).toContain('Add New Case');
    expect(response.text).toContain('href="/cases/new"');
    expect(response.text).toContain('href="/cases/1/edit"');
    expect(response.text).toContain('action="/cases/1/delete"');
    expect(response.text).toContain('aria-label="Cases"');
    expect(jest.mocked(axios.get)).toHaveBeenCalledWith('http://localhost:4000/cases/');
  });

  test('shows the new case form with the allowed statuses', async () => {
    const response = await request(app).get('/cases/new').expect(200);

    expect(response.text).toContain('Add New Case');
    expect(response.text).toContain('action="/cases"');
    expect(response.text).toContain('<option value="OPEN" selected>');
    expect(response.text).toContain('<option value="IN_PROGRESS">');
    expect(response.text).toContain('<option value="COMPLETED">');
    expect(response.text).toContain('<option value="CANCELLED">');
    expect(response.text).toContain('data-maxlength="200"');
    expect(response.text).toContain('govuk-character-count__message');
    expect(response.text).toContain('Cancel');
  });

  test('creates a case and redirects to the case list', async () => {
    jest.mocked(axios.post).mockResolvedValue(axiosResponse({}));

    await request(app)
      .post('/cases')
      .type('form')
      .send(caseItem)
      .expect(302)
      .expect('Location', '/');

    expect(jest.mocked(axios.post)).toHaveBeenCalledWith('http://localhost:4000/cases/', {
      title: caseItem.title,
      description: caseItem.description,
      status: caseItem.status,
      dueDate: caseItem.dueDate
    });
  });

  test('shows a validation error when a new case description exceeds 200 characters', async () => {
    const description = 'a'.repeat(201);

    const response = await request(app)
      .post('/cases')
      .type('form')
      .send({ ...caseItem, description })
      .expect(400);

    expect(response.text).toContain('Description must be 200 characters or fewer.');
    expect(response.text).toContain('value="Review application"');
    expect(response.text).toContain(description);
    expect(jest.mocked(axios.post)).not.toHaveBeenCalled();
  });

  test('loads the selected case into the edit form', async () => {
    jest.mocked(axios.get).mockResolvedValue(axiosResponse([caseItem]));

    const response = await request(app).get('/cases/1/edit').expect(200);

    expect(response.text).toContain('Update Case');
    expect(response.text).toContain('value="Review application"');
    expect(response.text).toContain('value="OPEN"');
    expect(response.text).toContain('action="/cases/1/edit"');
    expect(response.text).toContain('data-maxlength="200"');
    expect(response.text).toContain('govuk-character-count__message');
  });

  test('updates a case and redirects to the case list', async () => {
    jest.mocked(axios.put).mockResolvedValue(axiosResponse({}));

    await request(app)
      .post('/cases/1/edit')
      .type('form')
      .send({ ...caseItem, title: 'Updated application' })
      .expect(302)
      .expect('Location', '/');

    expect(jest.mocked(axios.put)).toHaveBeenCalledWith('http://localhost:4000/cases/1', {
      title: 'Updated application',
      description: caseItem.description,
      status: caseItem.status,
      dueDate: caseItem.dueDate
    });
  });

  test('shows a validation error when an updated description exceeds 200 characters', async () => {
    const description = 'a'.repeat(201);

    const response = await request(app)
      .post('/cases/1/edit')
      .type('form')
      .send({ ...caseItem, description })
      .expect(400);

    expect(response.text).toContain('Description must be 200 characters or fewer.');
    expect(response.text).toContain('value="Review application"');
    expect(response.text).toContain(description);
    expect(jest.mocked(axios.put)).not.toHaveBeenCalled();
  });

  test('deletes a case and redirects to the case list', async () => {
    jest.mocked(axios.delete).mockResolvedValue(axiosResponse({}));

    await request(app).post('/cases/1/delete').expect(302).expect('Location', '/');

    expect(jest.mocked(axios.delete)).toHaveBeenCalledWith('http://localhost:4000/cases/1');
  });
});
