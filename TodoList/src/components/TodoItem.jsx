import React from "react";
import "./TodoItem.css";

const TodoItem = ({ id, isDone, content, date, onUpdate, onRemove }) => {
    const onChangeCheckbox = () => {
        onUpdate(id);
    };

    const onClickDelete = () => {
        onRemove(id);
    };

    return (
        <div className='TodoItem'>
            <input
                checked={isDone}
                onChange={onChangeCheckbox}
                type='checkbox'
            />
            <div className='content'>{content}</div>
            <div className='date'>{new Date(date).toLocaleDateString()}</div>
            <button onClick={onClickDelete}>삭제</button>
        </div>
    );
};

export default TodoItem;
