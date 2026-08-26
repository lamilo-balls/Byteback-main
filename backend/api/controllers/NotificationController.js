/**
 * NotificationController.js
 *
 * Backs the "Notification Center" screen.
 */

module.exports = {

  // GET /api/notifications
  find: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    var notifications = await Notification.find({ user: req.session.userId }).sort('createdAt DESC');
    return res.json({ notifications: notifications });
  },

  // POST /api/notifications/:id/read
  markRead: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    var notification = await Notification.findOne({ id: req.params.id });
    if (!notification || notification.user !== req.session.userId) {
      return res.notFound({ error: 'Notification not found.' });
    }
    await Notification.updateOne({ id: notification.id }).set({ read: true });
    return res.json({ message: 'Marked as read.' });
  },

  // POST /api/notifications/read-all
  markAllRead: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    await Notification.update({ user: req.session.userId, read: false }).set({ read: true });
    return res.json({ message: 'All notifications marked as read.' });
  }

};
