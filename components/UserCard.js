
export default function UserCard({
    id,
    name,
    role,
    onDelete,
    onEdit
}) {
    return (
        <div className="user-card">
            <h2>{name}</h2>
            <p>{role}</p>

            <button onClick={() => onEdit(id)}>
                Edit
            </button>

            {" "}

            <button onClick={() => onDelete(id)}>
                Delete
            </button>
        </div>
    );
}
