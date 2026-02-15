import React from "react";
import "./List.css";
import TodoItem from "./TodoItem";
import { useState } from "react";

const List = ({ todos, onUpdate, onRemove }) => {
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    };

    const getFilteredData = () => {
        if (search === "") {
            return todos;
        }
        return todos.filter((todo) =>
            todo.content.toUpperCase().includes(search.toUpperCase()),
        );
    };

    const filteredTodos = getFilteredData();

    return (
        <div className='List'>
            <h4>Todo List ✅</h4>
            <input
                type='text'
                onChange={onChangeSearch}
                value={search}
                placeholder='검색어를 입력하세요'
            />
            <div className='todos_wrapper'>
                {filteredTodos.map((todo) => {
                    return (
                        <TodoItem
                            key={todo.id}
                            {...todo}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default List;
