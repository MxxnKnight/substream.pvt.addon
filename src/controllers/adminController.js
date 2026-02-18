
const { supabase } = require('../services/db');

const listSubtitles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subtitles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subtitles' });
  }
};

const deleteSubtitle = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the file path to delete from storage (if we were using storage bucket, but we are using local filesystem)
    const { data: subtitle, error: fetchError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Subtitle not found' });
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from('subtitles')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // TODO: Delete file from local filesystem
    // For now, we just delete from DB.

    res.json({ message: 'Subtitle deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subtitle' });
  }
};

module.exports = { listSubtitles, deleteSubtitle };
