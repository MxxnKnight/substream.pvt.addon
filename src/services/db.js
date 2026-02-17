
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing! Database operations will fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const insertSubtitle = async (data) => {
  const { data: result, error } = await supabase
    .from('subtitles')
    .insert([data])
    .select();

  if (error) throw error;
  return result[0];
};

const findSubtitles = async ({ imdb_id, season, episode, type }) => {
  let query = supabase
    .from('subtitles')
    .select('*')
    .eq('imdb_id', imdb_id);

  if (type) {
    query = query.eq('type', type);
  }

  if (season !== undefined && season !== null) {
    query = query.eq('season', season);
  }

  if (episode !== undefined && episode !== null) {
    query = query.eq('episode', episode);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

module.exports = {
  supabase,
  insertSubtitle,
  findSubtitles
};
