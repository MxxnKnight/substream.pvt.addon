
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

    // First get the file path to delete from storage
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

    // Delete file from Supabase storage
    if (subtitle.file_path) {
      try {
        const urlObj = new URL(subtitle.file_path);
        const pathSegments = urlObj.pathname.split('/');
        // URL path: /storage/v1/object/public/subtitles/tt12345/filename.srt
        // The bucket name is "subtitles"
        const storageIndex = pathSegments.indexOf('subtitles');
        if (storageIndex !== -1 && storageIndex + 1 < pathSegments.length) {
           const storagePath = pathSegments.slice(storageIndex + 1).join('/');
           const { error: storageError } = await supabase
             .storage
             .from('subtitles')
             .remove([storagePath]);

           if (storageError) {
             console.error(`Failed to delete file from Supabase Storage: ${storagePath}`, storageError);
           }
        }
      } catch (err) {
        console.error('Error parsing file URL for deletion:', err);
      }
    }

    res.json({ message: 'Subtitle deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subtitle' });
  }
};

module.exports = { listSubtitles, deleteSubtitle };
