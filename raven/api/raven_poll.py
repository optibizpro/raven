import frappe
from frappe import _


@frappe.whitelist(methods=["POST"])
def create_poll(
	channel_id: str,
	question: str,
	options: any,
	is_multi_choice: bool = None,
	is_anonymous: bool = None,
) -> str:
	"""
	Create a new poll in the Raven Poll doctype.
	"""
	# Check if the current user has access to the channel to create a poll.
	if not frappe.has_permission(doctype="Raven Channel", doc=channel_id, ptype="read"):
		frappe.throw(_("You do not have permission to access this channel"), frappe.PermissionError)

	poll = frappe.get_doc(
		{
			"doctype": "Raven Poll",
			"question": question,
			"is_multi_choice": is_multi_choice,
			"is_anonymous": is_anonymous,
			"channel_id": channel_id,
		}
	)

	for option in options:
		poll.append("options", option)

	poll.insert()

	# Poll message content is the poll question and options separated by a newline. (This would help with the searchability of the poll)
	poll_message_content = f"{question}\n"

	for option in options:
		poll_message_content += f" {option['option']}\n"

	# Send a message to the channel with type "poll" and the poll_id.
	message = frappe.get_doc(
		{
			"doctype": "Raven Message",
			"channel_id": channel_id,
			"text": "",
			"content": poll_message_content,
			"message_type": "Poll",
			"poll_id": poll.name,
		}
	)
	message.insert()

	return poll.name


@frappe.whitelist()
def get_poll(message_id):
	"""
	Get the poll data from the Raven Poll doctype.
	(Including the poll options, the number of votes for each option and the total number of votes.)
	"""

	# Check if the current user has access to the message.
	if not frappe.has_permission(doctype="Raven Message", doc=message_id, ptype="read"):
		frappe.throw(_("You do not have permission to access this message"), frappe.PermissionError)

	poll_id = frappe.get_cached_value("Raven Message", message_id, "poll_id")

	poll = frappe.get_cached_doc("Raven Poll", poll_id)

	# Check if the current user has already voted in the poll, if so, return the poll with the user's vote.
	current_user_vote = frappe.get_all(
		"Raven Poll Vote",
		filters={"poll_id": poll_id, "user_id": frappe.session.user},
		fields=["option"],
	)

	if current_user_vote:
		poll.current_user_vote = current_user_vote

	return {"poll": poll, "current_user_votes": current_user_vote}


@frappe.whitelist(methods=["POST"])
def add_vote(message_id, option_id):

	# Check if the current user has access to the message.
	if not frappe.has_permission(doctype="Raven Message", doc=message_id, ptype="read"):
		frappe.throw(_("You do not have permission to access this message"), frappe.PermissionError)

	poll_id = frappe.get_cached_value("Raven Message", message_id, "poll_id")
	is_poll_multi_choice = frappe.get_cached_value("Raven Poll", poll_id, "is_multi_choice")

	if is_poll_multi_choice:
		for option in option_id:
			frappe.get_doc(
				{
					"doctype": "Raven Poll Vote",
					"poll_id": poll_id,
					"option": option,
					"user_id": frappe.session.user,
				}
			).insert()
	else:
		frappe.get_doc(
			{
				"doctype": "Raven Poll Vote",
				"poll_id": poll_id,
				"option": option_id,
				"user_id": frappe.session.user,
			}
		).insert()

	return "Vote added successfully."