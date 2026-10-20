import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY || '';

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export async function searchOpportunities(query: string, limit = 8): Promise<SearchResult[]> {
  try {
    const response = await axios.get('https://api.search.tinyfish.ai', {
      params: { query },
      headers: {
        'X-API-Key': TINYFISH_API_KEY,
      },
      timeout: 15000,
    });

    const data = response.data;
    if (data && Array.isArray(data.results)) {
      return data.results.slice(0, limit).map((r: any) => ({
        url: r.url || r.link || '',
        title: r.title || '',
        snippet: r.snippet || r.description || '',
      })).filter((r: SearchResult) => Boolean(r.url));
    }
    return [];
  } catch (error: any) {
    console.error('TinyFish search error:', error?.response?.status, error?.response?.data || error.message);
    return [];
  }
}

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.fetch.tinyfish.ai',
      { urls: [url] },
      {
        headers: {
          'X-API-Key': TINYFISH_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const data = response.data;
    if (data?.results && Array.isArray(data.results) && data.results[0]) {
      const page = data.results[0];
      return page.text || page.markdown || page.content || page.title || '';
    }
    return '';
  } catch (error: any) {
    console.error('TinyFish fetch error for', url, ':', error?.response?.status, error?.response?.data || error.message);
    return '';
  }
}

export async function prepareRegistrationForm(
  registrationUrl: string,
  userProfile: Record<string, string>
): Promise<{ success: boolean; preparedFields: Record<string, string>; missingFields: string[]; agentNotes: string }> {
  // Map real user profile data to standard registration form fields
  const preparedFields: Record<string, string> = {};
  if (userProfile.name) preparedFields['Full Name'] = userProfile.name;
  if (userProfile.email) preparedFields['Email Address'] = userProfile.email;
  if (userProfile.college) preparedFields['College / University'] = userProfile.college;
  if (userProfile.branch) preparedFields['Branch / Major'] = userProfile.branch;
  if (userProfile.year) preparedFields['Year of Study'] = `Year ${userProfile.year}`;
  if (userProfile.city) preparedFields['City / Location'] = userProfile.city;

  const missingFields: string[] = [
    'GitHub Profile URL',
    'LinkedIn Profile URL',
    'Resume Link / Attachment',
    'Project Idea or Track Selection',
  ];

  return {
    success: true,
    preparedFields,
    missingFields,
    agentNotes: `Ready for review. ${Object.keys(preparedFields).length} fields matched from student profile. Please complete the remaining questions and verify before final submission on the official page.`,
  };
}
