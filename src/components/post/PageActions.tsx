import { ArrowUp, MessageCircle } from "lucide-react";
import ActionButton from "./ActionButton";
import CopyLinkButton from "./CopyLinkButton";

const PageActions = () => {
  return (
    <ul className="flex items-center gap-1" data-animate>
      <li>
        <CopyLinkButton />
      </li>
      <li>
        <ActionButton
          onClick={() => document.querySelector(".giscus")?.scrollIntoView({ behavior: "smooth" })}
        >
          <MessageCircle size={18} />
          <span className="sr-only">댓글으로 이동</span>
        </ActionButton>
      </li>
      <li className="lg:hidden">
        <ActionButton onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp size={18} />
          <span className="sr-only">상단으로 이동</span>
        </ActionButton>
      </li>
    </ul>
  );
};

export default PageActions;
