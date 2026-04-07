import unittest

from backend.data_pipeline import compute_resource_index, normalize_district


class DataPipelineTestCase(unittest.TestCase):
    def test_compute_resource_index_rewards_lower_ratio(self):
        stronger = compute_resource_index(1000, 90, 11.1, 12, 'PK', '12')
        weaker = compute_resource_index(1000, 60, 16.7, 12, 'PK', '12')
        self.assertGreater(stronger, weaker)

    def test_normalize_district_merges_directory_and_characteristics(self):
        directory_row = {
            'LEA_NAME': 'Example Public Schools',
            'LEAID': '9999999',
            'ST': 'VA',
            'STATENAME': 'VIRGINIA',
            'LCITY': 'Example City',
            'LSTATE': 'VA',
            'LZIP': '22222',
            'PHONE': '(555) 010-0000',
            'WEBSITE': 'https://example.org',
            'LEA_TYPE_TEXT': 'Regular public school district',
            'CHARTER_LEA_TEXT': 'Not a charter district',
            'SCHOOL_YEAR': '2018-2019',
        }
        characteristics_row = {
            'MEMBER': '1500',
            'TOTTCH': '100',
            'SCH': '14',
            'STUTERATIO': '15.0',
            'GSLO': 'PK',
            'GSHI': '12',
            'LOCALE_TEXT': 'Suburb: Large',
            'CONAME': 'Example County',
            'SURVYEAR': '2018-2019',
            'Lat': '38.0',
            'Long': '-77.0',
        }
        office_row = {
            'NMCBSA': 'Example Metro',
        }

        district = normalize_district(directory_row, characteristics_row, office_row)

        self.assertEqual(district['district_name'], 'Example Public Schools')
        self.assertEqual(district['state_name'], 'Virginia')
        self.assertEqual(district['county_name'], 'Example County')
        self.assertEqual(district['metro_area'], 'Example Metro')
        self.assertGreater(district['resource_index'], 0)


if __name__ == '__main__':
    unittest.main()
