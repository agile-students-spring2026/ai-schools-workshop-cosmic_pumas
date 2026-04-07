import unittest

from backend.app import create_app
from backend.data_pipeline import FALLBACK_FILE, read_dataset


TEST_DATA_STORE = read_dataset(FALLBACK_FILE)

class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(data_store=TEST_DATA_STORE)
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
        self.assertIn('resource_index', payload['districts'][0])
        self.assertIn('facets', payload)

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

    def test_district_detail_endpoint_returns_detail_payload(self):
        district_id = TEST_DATA_STORE['districts'][0]['id']
        response = self.client.get(f'/api/districts/{district_id}')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertIn('district', payload)
        self.assertIn('peers', payload)

    def test_district_detail_endpoint_returns_not_found(self):
        response = self.client.get('/api/districts/not-real')
        self.assertEqual(response.status_code, 404)

    def test_districts_endpoint_rejects_non_numeric_score(self):
        response = self.client.get('/api/districts?minScore=bad-value')
        self.assertEqual(response.status_code, 400)

    def test_compare_endpoint_respects_requested_order(self):
        ids = ','.join([TEST_DATA_STORE['districts'][1]['id'], TEST_DATA_STORE['districts'][0]['id']])
        response = self.client.get(f'/api/comparisons?ids={ids}')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['id'] for item in payload['districts']], ids.split(','))

    def test_data_status_endpoint_returns_meta(self):
        response = self.client.get('/api/data/status')
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['source_mode'], 'fallback')

    def test_compare_route_serves_frontend_shell(self):
        response = self.client.get('/compare')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'District Lens', response.data)
        response.close()

    def test_district_route_serves_frontend_shell(self):
        district_id = TEST_DATA_STORE['districts'][0]['id']
        response = self.client.get(f'/district/{district_id}')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'District Lens', response.data)
        response.close()

if __name__ == '__main__':
    unittest.main()
