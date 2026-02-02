import { Course, CourseCode, loadCourses } from "@/models/course";
import {
  CourseViewItemTag,
  CourseViewTab,
  getCourseViewTabs,
} from "@/models/courseView";
import { CourseList } from "@/components/CourseList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Summary } from "@/components/Summary";
import { FC, JSX } from "react";
import { SelectedCourses, setSelectedCourse } from "@/models/selectedCourse";
import { getPlannedCourseConflicts } from "@/models/timetable";

export const CourseView: FC<{
  selectedCourses: SelectedCourses;
  setSelectedCourses: (courses: SelectedCourses) => void;
}> = ({ selectedCourses, setSelectedCourses }) => {
  const courses = loadCourses();
  const conflictCourses = getPlannedCourseConflicts(courses, selectedCourses);
  const onCourseClick = (course: Course, newTag: CourseViewItemTag) => {
    if (newTag === "ineligible") return;
    setSelectedCourses(setSelectedCourse(selectedCourses, course, newTag));
  };

  const tabViews = [];
  const contents = [];
  for (const tab of getCourseViewTabs(courses, selectedCourses)) {
    const [tabView, content] = genInnerCourseView(
      tab,
      onCourseClick,
      conflictCourses,
    );
    tabViews.push(tabView);
    contents.push(content);
  }

  const defaultTab = tabViews.find((tabView) => !tabView.props.disabled)?.props
    .value;
  return (
    <div>
      <Tabs defaultValue={defaultTab} className="mb-16 text-start">
        <TabsList>{tabViews}</TabsList>
        {contents}
      </Tabs>
      <Summary selectedCourses={selectedCourses} />
    </div>
  );
};

function genInnerCourseView(
  tab: CourseViewTab,
  onCourseClick: (course: Course, tag: CourseViewItemTag) => void,
  conflictCourses: Map<CourseCode, Array<Course>>,
): [JSX.Element, JSX.Element] {
  const tabView = (
    <TabsTrigger key={tab.name} value={tab.name} disabled={tab.isDisabled}>
      {tab.name}
    </TabsTrigger>
  );

  if (tab.children.length === 0) {
    const content = (
      <TabsContent key={tab.name} value={tab.name}>
        <div className="mt-4">
          <CourseList
            items={tab.items}
            onCourseClick={onCourseClick}
            conflictCourses={conflictCourses}
          />
        </div>
      </TabsContent>
    );
    return [tabView, content];
  }

  const tabViews = [];
  const contents = [];
  for (const childItem of tab.children) {
    const [tabView, content] = genInnerCourseView(
      childItem,
      onCourseClick,
      conflictCourses,
    );
    tabViews.push(tabView);
    contents.push(content);
  }

  const defaultTab = tabViews.find((tabView) => !tabView.props.disabled)?.props
    .value;
  const content = (
    <TabsContent key={tab.name} value={tab.name}>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full justify-start overflow-x-scroll">
          {tabViews}
        </TabsList>
        {contents}
      </Tabs>
    </TabsContent>
  );

  return [tabView, content];
}
