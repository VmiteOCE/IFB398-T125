import { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function UserManagementModal({ show, onHide }) {
    const [view, setView] = useState("list");
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(20);
    const [selectedUser, setSelectedUser] = useState(null);

    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        role: "viewer"
    });

    const [editUser, setEditUser] = useState({
        role: "",
        password: ""
    });

    useEffect(() => {
        if (show) {
            loadUsers();
        }
    }, [show]);


    async function loadUsers() {
        try {
            const response = await fetch("/user");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setUsers(data.users);
        } catch (error) {
            console.error(
                "Failed loading users:",
                error
            );
        }
    }

    async function createUser() {
        try {
            await fetch("/user", {
                method: "POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(newUser)
            });

            setNewUser({
                username:"",
                password:"",
                role:"viewer"
            });

            await loadUsers();
            setView("list");
        } catch(error){
            console.error(error);
        }
    }

    async function updateUser(){
        try {
            await fetch("/user", {
                method:"PATCH",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    username: selectedUser.username,
                    role: editUser.role,
                    password: editUser.password
                })
            });

            await loadUsers();
            setView("list");
        } catch(error){
            console.error(error);
        }
    }

    async function deleteUser(){
        try {
            await fetch("/user", {
                method:"DELETE",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    username:selectedUser.username
                })
            });

            await loadUsers();
            setView("list");
        } catch(error){
            console.error(error);
        }
    }

    const filteredUsers = users.filter(user=>{
        const searchMatch =
            user.username
            .toLowerCase()
            .includes(search.toLowerCase());

        const roleMatch = roleFilter === "all" || user.role === roleFilter;
        return searchMatch && roleMatch;
    });

    const visibleUsers = filteredUsers.slice(0, visibleCount);

    function handleScroll(e){
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if(bottom){
            setVisibleCount(previous=>previous + 20);
        }
    }

    return (
        <Modal
            show={show}
            onHide={() => {
                setView("list");
                setSelectedUser(null);
                onHide();
            }}
            centered size="lg"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    User Management
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {view === "list" && (
                    <>
                    <div className="d-flex gap-3 mb-3">
                        <Form.Control
                            placeholder="Search"
                            value={search}
                            onChange={e=>setSearch(e.target.value)}
                        />

                        <Form.Select
                            value={roleFilter}
                            onChange={e=>setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>

                            <option value="admin">Admin</option>
                            <option value="analyst">Analyst</option>
                            <option value="coach">Coach</option>
                            <option value="viewer">Viewer</option>
                        </Form.Select>

                        <Button onClick={()=>{setView("create")}}>
                            Create
                        </Button>
                    </div>

                    <div style={{ height:"400px", overflowY:"auto"}} onScroll={handleScroll}>
                    {visibleUsers.map(user=>(
                        <div
                            key={user.username}
                            className="d-flex justify-content-between align-items-center p-3 mb-2"
                            style={{
                                background:"#8C5F5F",
                                borderRadius:"10px"
                            }}
                        >

                            <span>
                                {user.username}
                            </span>

                            <span>
                                {user.role}
                            </span>

                            <div>
                                <Button
                                    className="me-2"
                                    onClick={()=>{
                                        setSelectedUser(user);
                                        setEditUser({
                                            role:user.role,
                                            password:""
                                        });
                                        setView("edit");
                                    }}
                                >
                                    Edit
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={()=>{
                                        setSelectedUser(user);
                                        setView("delete");
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                    </div>
                    </>
                )}

                {view === "create" && (
                    <>
                        <h4>Create User</h4>
                        <Form.Control
                            className="mb-3"
                            placeholder="Username"
                            value={newUser.username}
                            onChange={
                                e=>setNewUser({
                                    ...newUser,
                                    username:e.target.value
                                })
                            }
                        />

                        <Form.Control
                            className="mb-3"
                            placeholder="Password"
                            type="password"
                            value={newUser.password}
                            onChange={
                                e=>setNewUser({
                                    ...newUser,
                                    password:e.target.value
                                })
                            }
                        />

                        <Form.Select
                            value={newUser.role}
                            onChange={
                                e=>setNewUser({ ...newUser, role:e.target.value })
                            }
                        >

                            <option>viewer</option>
                            <option>coach</option>
                            <option>analyst</option>
                            <option>admin</option>
                        </Form.Select>

                        <Button className="mt-3" onClick={createUser}>
                            Create User
                        </Button>
                    </>
                )}

                {view === "edit" && (
                    <>
                        <h4>
                            Edit {selectedUser.username}
                        </h4>

                        <Form.Select
                            value={editUser.role}
                            onChange={e=>setEditUser({ ...editUser, role:e.target.value })}
                        >
                            <option>viewer</option>
                            <option>coach</option>
                            <option>analyst</option>
                            <option>admin</option>
                        </Form.Select>

                        <Form.Control
                            className="mt-3"
                            placeholder="New Password"
                            type="password"
                            value={editUser.password}
                            onChange={e=>setEditUser({ ...editUser, password:e.target.value })}
                        />
                        <div className="d-flex gap-2 mt-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSelectedUser(null);
                                setEditUser({
                                    role: "",
                                    password: ""
                                });
                                setView("list");
                            }}
                        >
                            Cancel
                        </Button>

                        <Button onClick={updateUser}>
                            Save Changes
                        </Button>

                    </div>
                    </>
                )}

                {view === "delete" && (
                    <>
                        <h4>
                            Delete User
                        </h4>

                        <p>
                            Are you sure you want to delete {" "} {selectedUser.username}?
                        </p>
                        <Button variant="danger" onClick={deleteUser}>
                            Delete
                        </Button>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );

}