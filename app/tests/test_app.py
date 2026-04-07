import unittest

from backend.app import create_app

class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_index_serves_frontend(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'School District Evaluator', response.data)
        response.close()

    def test_districts_endpoint_returns_seed_data(self):
        response = self.client.get('/api/districts')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(payload['districts']), 0)
        self.assertIn('summary', payload)
        self.assertIn('parent_fit_score', payload['districts'][0])

    def test_districts_endpoint_filters_by_state(self):
        response = self.client.get('/api/districts?state=MD')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload['districts'])
        self.assertTrue(all(item['state'] == 'MD' for item in payload['districts']))

    def test_districts_endpoint_searches_full_state_name(self):
        response = self.client.get('/api/districts?search=Maryland')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload['districts'])
        self.assertTrue(all(item['state'] == 'MD' for item in payload['districts']))

    def test_district_detail_endpoint_returns_not_found(self):
        response = self.client.get('/api/districts/not-real')
        self.assertEqual(response.status_code, 404)

    def test_districts_endpoint_rejects_non_numeric_score(self):
        response = self.client.get('/api/districts?minScore=bad-value')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
