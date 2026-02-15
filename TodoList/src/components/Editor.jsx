import React, { useState, useRef } from "react";
import "./Editor.css";

const Editor = ({ onCreate }) => {
    const [content, setContent] = useState("");
    const contentRef = useRef();

    const onChangeContent = (e) => {
        setContent(e.target.value);
    };

    // 엔터 쳤을 때 Submit 하기
    const onKeydown = (e) => {
      if(e.keyCode === 13){
        onSubmit();
      }
    }

    const onSubmit = () => {
        // 빈 입력문일 때 포커싱 되기
        if (content === "") {
            contentRef.current.focus();
            return;
        }

        onCreate(content);
        setContent("");
    };

    return (
        <div className='Editor'>
            <input
                ref={contentRef}
                type='text'
                placeholder='새로운 Todo...'
                value={content}
                onKeyDown={onKeydown}
                onChange={onChangeContent}
            />
            <button onClick={onSubmit}>추가</button>
        </div>
    );
};

export default Editor;
