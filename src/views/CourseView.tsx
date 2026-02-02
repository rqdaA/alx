import { Course, CourseCode, loadCourses } from "@/models/course";
import {
  CourseViewItem,
  CourseViewItemTag,
  CourseViewTab,
  getCourseViewTabs,
} from "@/models/courseView";
import { CourseList } from "@/components/CourseList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Summary } from "@/components/Summary";
import { FC, JSX, useMemo, useState } from "react";
import { SelectedCourses, setSelectedCourse } from "@/models/selectedCourse";
import { getPlannedCourseConflicts } from "@/models/timetable";
import { Input } from "@/components/ui/input";

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

  const [queries, setQueries] = useState<Record<string, string>>({});

  const rootTabItems = useMemo(() => {
    const byRoot = new Map<string, CourseViewItem[]>();
    const collect = (tab: CourseViewTab, collected: CourseViewItem[]) => {
      collected.push(...tab.items);
      for (const child of tab.children) {
        collect(child, collected);
      }
    };

    for (const tab of getCourseViewTabs(courses, selectedCourses)) {
      const collected: CourseViewItem[] = [];
      collect(tab, collected);
      byRoot.set(tab.name, collected);
    }

    return byRoot;
  }, [courses, selectedCourses]);

  const tabViews = [];
  const contents = [];
  for (const tab of getCourseViewTabs(courses, selectedCourses)) {
    const [tabView, content] = genInnerCourseView(
      tab,
      onCourseClick,
      conflictCourses,
      [tab.name],
      queries,
      setQueries,
      rootTabItems,
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
  path: string[],
  queries: Record<string, string>,
  setQueries: (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => void,
  rootTabItems: Map<string, CourseViewItem[]>,
): [JSX.Element, JSX.Element] {
  const tabView = (
    <TabsTrigger key={tab.name} value={tab.name} disabled={tab.isDisabled}>
      {tab.name}
    </TabsTrigger>
  );

  if (tab.children.length === 0) {
    const rootName = path[0];
    const pathKey = rootName === "基礎関連科目" ? rootName : path.join(" / ");
    const query = queries[pathKey] ?? "";
    const isSearchable = rootName === "基礎関連科目";
    const normalizedQuery = query.trim().toLowerCase();
    const itemsForFilter =
      rootName === "基礎関連科目" && normalizedQuery.length > 0
        ? (rootTabItems.get(rootName) ?? [])
        : tab.items;
    const filteredItems =
      isSearchable && normalizedQuery.length > 0
        ? itemsForFilter.filter((item) => {
            const code = item.code.toLowerCase();
            const name = item.name;
            return (
              code.includes(normalizedQuery) || name.includes(normalizedQuery)
            );
          })
        : tab.items;

    const content = (
      <TabsContent key={tab.name} value={tab.name}>
        <div className="mt-4">
          {isSearchable && (
            <div className="mb-3 max-w-md">
              <Input
                defaultValue={query}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const value = event.currentTarget.value.trim();
                  setQueries((prev) => ({ ...prev, [pathKey]: value }));
                }}
                placeholder="検索（科目名/科目番号）"
              />
            </div>
          )}
          <CourseList
            items={filteredItems}
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
      [...path, childItem.name],
      queries,
      setQueries,
      rootTabItems,
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
