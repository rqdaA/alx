import { ExternalLink } from "lucide-react";
import { Course, CourseCode } from "@/models/course";
import { CourseViewItem, CourseViewItemTag } from "@/models/courseView";
import { CourseTagSelector } from "./CourseTagSelector";
import { SyllabusLink } from "./SyllabusLink";
import { cn } from "@/lib/utils";

export interface CourseListProps {
  items: Array<CourseViewItem>;
  onCourseClick: (course: Course, newTag: CourseViewItemTag) => void;
  conflictCourses?: Map<CourseCode, Array<Course>>;
}

export function CourseList(props: CourseListProps) {
  return (
    <div className="flex flex-col gap-y-1">
      {props.items.map((item) => (
        <CourseListItem
          key={item.code}
          item={item}
          onClick={props.onCourseClick}
          conflictCourses={props.conflictCourses?.get(item.code) ?? []}
        />
      ))}
    </div>
  );
}

interface CourseListItemProps {
  item: CourseViewItem;
  onClick: (course: Course, newTag: CourseViewItemTag) => void;
  conflictCourses: Array<Course>;
}

function CourseListItem(props: CourseListItemProps) {
  const tagColors = {
    enrolled: "border-green-200",
    planned: "border-blue-200",
    considering: "border-yellow-200",
    declined: "",
    ineligible: "border-gray-200 bg-gray-100",
  };
  const showConflict = props.conflictCourses.length > 0;

  return (
    <div
      className={cn(
        "flex items-center border-l-4 px-1",
        tagColors[props.item.tag],
      )}
    >
      <SyllabusLink code={props.item.code}>
        <ExternalLink />
      </SyllabusLink>
      <div className="flex w-full justify-between pl-2">
        <div className="flex flex-col items-start">
          <span className="text-xs">{props.item.code}</span>
          <b className="text-md max-w-3xl text-left">{props.item.name}</b>
          {showConflict ? (
            <span
              className={cn(
                "text-xs",
                props.item.tag === "enrolled" && "text-yellow-700",
                props.item.tag === "planned" && "text-sm text-red-700",
                "text-yellow-700",
              )}
            >
              {props.conflictCourses
                .map((course) => `${course.code} ${course.name}`)
                .join(", ")}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-x-4">
          <div className="text-right">
            <span className="text-md">{props.item.module}</span>
          </div>
          <div className="w-20 text-right">
            <span className="text-md">{props.item.period}</span>
          </div>
          <div className="w-12 text-right">
            <span className="text-md">{props.item.credit}</span>
            <span className="text-xs">単位</span>
          </div>
          <div className="w-16 text-right">
            <span className="text-md">{props.item.standardYear}</span>
            <span className="text-xs">年次</span>
          </div>
          <CourseTagSelector
            tag={props.item.tag}
            disabled={props.item.tag === "ineligible"}
            onClick={(tag) => props.onClick(props.item, tag)}
          />
        </div>
      </div>
    </div>
  );
}
