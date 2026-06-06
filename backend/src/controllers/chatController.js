const { chat, listItems } = require('../services/chatService');

const sendMessage = async (req, res, next) => {
  try {
    const { history = [], message, topic, selectedId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });

    const reply = await chat(history, message, topic, selectedId);
    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
};

const getItems = async (req, res, next) => {
  try {
    const { topic } = req.params;
    const items = await listItems(topic);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getItems };
